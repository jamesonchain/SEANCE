//! Commit/reveal auction rules shared by the Tari template adapter.
//!
//! During bidding, only a SHA-256 commitment and a deposit are recorded. The
//! amount and salt become available to the contract only when the bidder
//! reveals them. Tari confidential vaults can hide deposit amounts; the
//! adapter must use that resource type rather than treating the `deposit`
//! field in this pure rules crate as public chain data.

use sha2::{Digest, Sha256};
use std::collections::HashMap;

#[derive(Debug, PartialEq, Eq)]
pub enum AuctionError {
    BiddingClosed,
    RevealNotOpen,
    AlreadyCommitted,
    AlreadyRevealed,
    ZeroAmount,
    InvalidCommitment,
    LateReveal,
    NotSeller,
    AlreadySettled,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Bid {
    pub bidder: String,
    pub commitment: String,
    pub deposit: u64,
    sequence: u64,
    revealed_amount: Option<u64>,
}

#[derive(Debug, PartialEq, Eq)]
pub struct Settlement {
    pub winner: Option<String>,
    pub winning_amount: Option<u64>,
    pub refunds: HashMap<String, u64>,
    pub forfeited_to_seller: HashMap<String, u64>,
}

#[derive(Debug, PartialEq, Eq)]
enum Phase { Bidding, Reveal, Settled }

#[derive(Debug)]
pub struct Auction {
    seller: String,
    phase: Phase,
    next_sequence: u64,
    bids: Vec<Bid>,
}

/// The commitment a bidder submits: `hex(SHA256(amount || ":" || salt))`.
/// The salt is never stored in the commitment phase.
pub fn commitment_for(amount: u64, salt: &str) -> String {
    let mut hasher = Sha256::new();
    hasher.update(amount.to_string().as_bytes());
    hasher.update(b":");
    hasher.update(salt.as_bytes());
    format!("{:x}", hasher.finalize())
}

impl Auction {
    pub fn create(seller: impl Into<String>) -> Self {
        Self { seller: seller.into(), phase: Phase::Bidding, next_sequence: 0, bids: Vec::new() }
    }

    pub fn commit_bid(&mut self, bidder: impl Into<String>, commitment: impl Into<String>, deposit: u64) -> Result<(), AuctionError> {
        if self.phase != Phase::Bidding { return Err(AuctionError::BiddingClosed); }
        if deposit == 0 { return Err(AuctionError::ZeroAmount); }
        let bidder = bidder.into();
        if self.bids.iter().any(|bid| bid.bidder == bidder) { return Err(AuctionError::AlreadyCommitted); }
        self.bids.push(Bid { bidder, commitment: commitment.into(), deposit, sequence: self.next_sequence, revealed_amount: None });
        self.next_sequence += 1;
        Ok(())
    }

    pub fn close_bidding(&mut self, caller: &str) -> Result<(), AuctionError> {
        if caller != self.seller { return Err(AuctionError::NotSeller); }
        if self.phase != Phase::Bidding { return Err(AuctionError::BiddingClosed); }
        self.phase = Phase::Reveal;
        Ok(())
    }

    pub fn reveal_bid(&mut self, bidder: &str, amount: u64, salt: &str) -> Result<(), AuctionError> {
        if self.phase == Phase::Settled { return Err(AuctionError::LateReveal); }
        if self.phase != Phase::Reveal { return Err(AuctionError::RevealNotOpen); }
        if amount == 0 { return Err(AuctionError::ZeroAmount); }
        let bid = self.bids.iter_mut().find(|bid| bid.bidder == bidder).ok_or(AuctionError::InvalidCommitment)?;
        if bid.revealed_amount.is_some() { return Err(AuctionError::AlreadyRevealed); }
        if bid.commitment != commitment_for(amount, salt) { return Err(AuctionError::InvalidCommitment); }
        bid.revealed_amount = Some(amount);
        Ok(())
    }

    pub fn settle(&mut self, caller: &str) -> Result<Settlement, AuctionError> {
        if caller != self.seller { return Err(AuctionError::NotSeller); }
        if self.phase == Phase::Bidding { return Err(AuctionError::RevealNotOpen); }
        if self.phase == Phase::Settled { return Err(AuctionError::AlreadySettled); }
        let winner = self.bids.iter().filter_map(|bid| bid.revealed_amount.map(|amount| (bid, amount)))
            .max_by(|(left, left_amount), (right, right_amount)| left_amount.cmp(right_amount).then_with(|| right.sequence.cmp(&left.sequence)));
        let mut refunds = HashMap::new();
        let mut forfeited_to_seller = HashMap::new();
        for bid in &self.bids {
            match (winner.as_ref(), bid.revealed_amount) {
                (Some((winning_bid, _)), Some(_)) if bid.bidder != winning_bid.bidder => { refunds.insert(bid.bidder.clone(), bid.deposit); }
                (_, None) => { forfeited_to_seller.insert(bid.bidder.clone(), bid.deposit); }
                _ => {}
            }
        }
        let result = Settlement { winner: winner.map(|(bid, _)| bid.bidder.clone()), winning_amount: winner.map(|(_, amount)| amount), refunds, forfeited_to_seller };
        self.phase = Phase::Settled;
        Ok(result)
    }

    pub fn bid_count(&self) -> usize { self.bids.len() }
}

#[cfg(test)]
mod tests {
    use super::*;
    fn auction() -> Auction { Auction::create("seller") }
    fn commit(a: &mut Auction, bidder: &str, amount: u64, salt: &str, deposit: u64) { a.commit_bid(bidder, commitment_for(amount, salt), deposit).unwrap(); }

    #[test]
    fn valid_commit_reveal_settlement_refunds_loser() {
        let mut a = auction(); commit(&mut a, "alice", 80, "a-salt", 100); commit(&mut a, "bob", 140, "b-salt", 120);
        a.close_bidding("seller").unwrap(); a.reveal_bid("alice", 80, "a-salt").unwrap(); a.reveal_bid("bob", 140, "b-salt").unwrap();
        let result = a.settle("seller").unwrap();
        assert_eq!(result.winner, Some("bob".into())); assert_eq!(result.winning_amount, Some(140)); assert_eq!(result.refunds["alice"], 100); assert!(result.forfeited_to_seller.is_empty());
    }

    #[test] fn wrong_salt_is_rejected() { let mut a = auction(); commit(&mut a, "alice", 80, "right", 1); a.close_bidding("seller").unwrap(); assert_eq!(a.reveal_bid("alice", 80, "wrong"), Err(AuctionError::InvalidCommitment)); }
    #[test] fn late_commit_is_rejected() { let mut a = auction(); a.close_bidding("seller").unwrap(); assert_eq!(a.commit_bid("alice", "c", 1), Err(AuctionError::BiddingClosed)); }
    #[test] fn late_reveal_is_rejected() { let mut a = auction(); commit(&mut a, "alice", 80, "salt", 1); a.close_bidding("seller").unwrap(); a.settle("seller").unwrap(); assert_eq!(a.reveal_bid("alice", 80, "salt"), Err(AuctionError::LateReveal)); }

    #[test]
    fn no_reveal_forfeits_deposit() { let mut a = auction(); commit(&mut a, "alice", 80, "salt", 100); a.close_bidding("seller").unwrap(); let result = a.settle("seller").unwrap(); assert_eq!(result.winner, None); assert_eq!(result.forfeited_to_seller["alice"], 100); }

    #[test]
    fn tie_goes_to_earliest_commit() { let mut a = auction(); commit(&mut a, "alice", 100, "a", 1); commit(&mut a, "bob", 100, "b", 1); a.close_bidding("seller").unwrap(); a.reveal_bid("alice", 100, "a").unwrap(); a.reveal_bid("bob", 100, "b").unwrap(); assert_eq!(a.settle("seller").unwrap().winner, Some("alice".into())); }
    #[test] fn double_commit_is_rejected() { let mut a = auction(); commit(&mut a, "alice", 2, "a", 1); assert_eq!(a.commit_bid("alice", "other", 1), Err(AuctionError::AlreadyCommitted)); }
    #[test] fn zero_bid_is_rejected() { let mut a = auction(); assert_eq!(a.commit_bid("alice", "c", 0), Err(AuctionError::ZeroAmount)); commit(&mut a, "bob", 1, "b", 1); a.close_bidding("seller").unwrap(); assert_eq!(a.reveal_bid("bob", 0, "b"), Err(AuctionError::ZeroAmount)); }
    #[test] fn seller_cannot_cheat_phase_or_settlement() { let mut a = auction(); assert_eq!(a.close_bidding("intruder"), Err(AuctionError::NotSeller)); commit(&mut a, "alice", 5, "a", 1); a.close_bidding("seller").unwrap(); assert_eq!(a.settle("intruder"), Err(AuctionError::NotSeller)); a.settle("seller").unwrap(); assert_eq!(a.settle("seller"), Err(AuctionError::AlreadySettled)); }
}
