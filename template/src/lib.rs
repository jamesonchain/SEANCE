//! Deterministic auction rules shared by the Tari template adapter.
//!
//! The `amount` is intentionally only accepted during settlement. A production
//! adapter maps the commitment and escrow receipt to Tari confidential/stealth
//! resources; this crate never pretends that a public component can inspect a
//! hidden amount by itself.

use std::collections::HashMap;

#[derive(Debug, PartialEq, Eq)]
pub enum AuctionError { Closed, AlreadyBid, ZeroBid, NotSeller, AlreadySettled, UnknownBidder, MissingReveal }

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Bid { pub bidder: String, pub commitment: String, pub deposit: u64, sequence: u64 }

#[derive(Debug, PartialEq, Eq)]
pub struct Settlement { pub winner: String, pub winning_amount: u64, pub refunds: HashMap<String, u64> }

#[derive(Debug)]
pub struct Auction { seller: String, closed: bool, settled: bool, next_sequence: u64, bids: Vec<Bid> }

impl Auction {
    pub fn create(seller: impl Into<String>) -> Self { Self { seller: seller.into(), closed: false, settled: false, next_sequence: 0, bids: Vec::new() } }

    pub fn place_bid(&mut self, bidder: impl Into<String>, commitment: impl Into<String>, deposit: u64) -> Result<(), AuctionError> {
        if self.closed { return Err(AuctionError::Closed); }
        if deposit == 0 { return Err(AuctionError::ZeroBid); }
        let bidder = bidder.into();
        if self.bids.iter().any(|bid| bid.bidder == bidder) { return Err(AuctionError::AlreadyBid); }
        self.bids.push(Bid { bidder, commitment: commitment.into(), deposit, sequence: self.next_sequence });
        self.next_sequence += 1;
        Ok(())
    }

    pub fn close(&mut self, caller: &str) -> Result<(), AuctionError> {
        if caller != self.seller { return Err(AuctionError::NotSeller); }
        if self.closed { return Err(AuctionError::Closed); }
        self.closed = true;
        Ok(())
    }

    /// Reveals only the caller's own bid. Ties are won by the earliest commitment.
    pub fn settle(&mut self, caller: &str, reveals: &[(String, u64)]) -> Result<Settlement, AuctionError> {
        if caller != self.seller { return Err(AuctionError::NotSeller); }
        if !self.closed { return Err(AuctionError::Closed); }
        if self.settled { return Err(AuctionError::AlreadySettled); }
        if self.bids.is_empty() { return Err(AuctionError::MissingReveal); }
        let mut winner: Option<(&Bid, u64)> = None;
        let mut refunds = HashMap::new();
        for bid in &self.bids {
            let amount = reveals.iter().find(|(who, _)| who == &bid.bidder).map(|(_, amount)| *amount).ok_or(AuctionError::MissingReveal)?;
            if amount == 0 { return Err(AuctionError::ZeroBid); }
            if winner.map(|(_, current)| amount > current).unwrap_or(true) { winner = Some((bid, amount)); }
        }
        let (winning_bid, winning_amount) = winner.ok_or(AuctionError::MissingReveal)?;
        for bid in &self.bids { if bid.bidder != winning_bid.bidder { refunds.insert(bid.bidder.clone(), bid.deposit); } }
        self.settled = true;
        Ok(Settlement { winner: winning_bid.bidder.clone(), winning_amount, refunds })
    }

    pub fn bid_count(&self) -> usize { self.bids.len() }
}

#[cfg(test)]
mod tests {
    use super::*;
    fn auction() -> Auction { Auction::create("seller") }

    #[test] fn creates_and_settles_highest_bid() {
        let mut a = auction(); a.place_bid("alice", "c1", 100).unwrap(); a.place_bid("bob", "c2", 120).unwrap(); a.close("seller").unwrap();
        let result = a.settle("seller", &[("alice".into(), 80), ("bob".into(), 140)]).unwrap();
        assert_eq!(result.winner, "bob"); assert_eq!(result.winning_amount, 140); assert_eq!(result.refunds["alice"], 100);
    }
    #[test] fn rejects_late_and_double_bids() { let mut a = auction(); a.place_bid("alice", "c1", 1).unwrap(); assert_eq!(a.place_bid("alice", "c2", 2), Err(AuctionError::AlreadyBid)); a.close("seller").unwrap(); assert_eq!(a.place_bid("bob", "c2", 2), Err(AuctionError::Closed)); }
    #[test] fn seller_cannot_close_or_settle_as_someone_else() { let mut a = auction(); assert_eq!(a.close("intruder"), Err(AuctionError::NotSeller)); a.place_bid("alice", "c1", 2).unwrap(); a.close("seller").unwrap(); assert_eq!(a.settle("intruder", &[("alice".into(), 2)]), Err(AuctionError::NotSeller)); }
    #[test] fn rejects_zero_bids_and_zero_reveals() { let mut a = auction(); assert_eq!(a.place_bid("alice", "c1", 0), Err(AuctionError::ZeroBid)); a.place_bid("alice", "c1", 1).unwrap(); a.close("seller").unwrap(); assert_eq!(a.settle("seller", &[("alice".into(), 0)]), Err(AuctionError::ZeroBid)); }
    #[test] fn rejects_missing_reveal_and_empty_auction() { let mut a = auction(); a.close("seller").unwrap(); assert_eq!(a.settle("seller", &[]), Err(AuctionError::MissingReveal)); let mut b = auction(); b.place_bid("alice", "c1", 1).unwrap(); b.close("seller").unwrap(); assert_eq!(b.settle("seller", &[]), Err(AuctionError::MissingReveal)); }
    #[test] fn tie_goes_to_earliest_bid() { let mut a = auction(); a.place_bid("alice", "c1", 5).unwrap(); a.place_bid("bob", "c2", 5).unwrap(); a.close("seller").unwrap(); let result = a.settle("seller", &[("alice".into(), 10), ("bob".into(), 10)]).unwrap(); assert_eq!(result.winner, "alice"); }
}
