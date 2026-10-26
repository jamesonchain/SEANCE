//! Thin Tari Ootle adapter for the tested commit/reveal rules.
//!
//! The adapter deliberately never reads a blinded deposit amount. Deposits live in one Vault
//! per bid. A bidder/seller supplies a `ConfidentialWithdrawProof` when claiming confidential
//! funds; a public-resource claim may pass `None`.

use tari_template_lib::prelude::*;
use tari_template_lib::intrinsics::hash_sha256_parts;
use minicbor::{CborLen, Decode, Encode};

#[derive(Debug, Encode, Decode, CborLen)]
pub struct Bid {
    #[n(0)]
    bidder: ComponentAddress,
    #[n(1)]
    commitment: Hash32,
    #[n(2)]
    sequence: u64,
    #[n(3)]
    revealed_amount: Option<Amount>,
    #[n(4)]
    deposit: Vault,
    #[n(5)]
    claimed: bool,
}

#[template]
mod seance_auction_template {
    use super::*;

    pub struct SeanceAuction {
        seller: ComponentAddress,
        deposit_resource: ResourceAddress,
        phase: u8,
        next_sequence: u64,
        bids: Vec<Bid>,
    }

    impl SeanceAuction {
        pub fn instantiate(seller: ComponentAddress, deposit_resource: ResourceAddress) -> Component<Self> {
            Component::new(Self {
                seller,
                deposit_resource,
                phase: 0,
                next_sequence: 0,
                bids: Vec::new(),
            })
            .with_access_rules(ComponentAccessRules::allow_all())
            .create()
        }

        /// Commit `SHA256(decimal_amount || ":" || salt)` and escrow a non-empty deposit.
        /// The deposit amount is not inspected, so confidential vaults remain confidential.
        pub fn commit(&mut self, commitment: Vec<u8>, deposit: Bucket) {
            assert_eq!(self.phase, 0, "bidding is closed");
            assert_eq!(deposit.resource_address(), self.deposit_resource, "wrong deposit resource");
            assert!(!deposit.is_empty(), "deposit must be non-zero");
            let bidder = CallerContext::current_component_address();
            assert!(!self.bids.iter().any(|bid| bid.bidder == bidder), "bidder already committed");
            let commitment = Hash32::try_from(commitment).expect("commitment must be 32 bytes");
            self.bids.push(Bid {
                bidder,
                commitment,
                sequence: self.next_sequence,
                revealed_amount: None,
                deposit: Vault::from_bucket(deposit),
                claimed: false,
            });
            self.next_sequence += 1;
        }

        pub fn close_bidding(&mut self) {
            assert_eq!(CallerContext::current_component_address(), self.seller, "seller only");
            assert_eq!(self.phase, 0, "bidding is already closed");
            self.phase = 1;
        }

        /// Reveal the amount and salt. The amount becomes public in the component state here.
        pub fn reveal(&mut self, amount: Amount, salt: Vec<u8>) {
            assert_eq!(self.phase, 1, "reveal phase is not open");
            assert!(amount.is_positive(), "bid must be non-zero");
            let bidder = CallerContext::current_component_address();
            let bid = self.bids.iter_mut().find(|bid| bid.bidder == bidder).expect("no commitment");
            assert!(bid.revealed_amount.is_none(), "bid already revealed");
            let amount_text = amount.to_string();
            let separator = b":";
            let expected = hash_sha256_parts(&[amount_text.as_bytes(), separator, salt.as_slice()]);
            assert_eq!(bid.commitment, expected, "commitment does not match amount and salt");
            bid.revealed_amount = Some(amount);
        }

        /// Freeze the winner. Ties use the lowest commitment sequence.
        pub fn settle(&mut self) {
            assert_eq!(CallerContext::current_component_address(), self.seller, "seller only");
            assert_eq!(self.phase, 1, "reveal phase is not open");
            self.phase = 2;
        }

        pub fn winner(&self) -> Option<ComponentAddress> {
            self.winner_index().map(|index| self.bids[index].bidder)
        }

        pub fn bid_count(&self) -> u32 { self.bids.len() as u32 }

        /// A revealed losing bidder claims their escrow. Unrevealed deposits are not eligible.
        pub fn claim_refund(&mut self, proof: Option<ConfidentialWithdrawProof>) -> Bucket {
            assert_eq!(self.phase, 2, "auction is not settled");
            let bidder = CallerContext::current_component_address();
            let winner = self.winner_index();
            let index = self.bids.iter().position(|item| item.bidder == bidder).expect("no commitment");
            let bid = &mut self.bids[index];
            assert!(bid.revealed_amount.is_some(), "unrevealed bid forfeited");
            assert_ne!(winner, Some(index), "winner deposit is not a refund");
            assert!(!bid.claimed, "deposit already claimed");
            bid.claimed = true;
            match proof {
                Some(proof) => bid.deposit.withdraw_confidential(proof),
                None => bid.deposit.withdraw_all(),
            }
        }

        /// Seller claims the winning and unrevealed deposits. The caller must provide one
        /// confidential proof per blinded vault in separate calls; public deposits may pass None.
        pub fn claim_forfeited(&mut self, bidder: ComponentAddress, proof: Option<ConfidentialWithdrawProof>) -> Bucket {
            assert_eq!(CallerContext::current_component_address(), self.seller, "seller only");
            assert_eq!(self.phase, 2, "auction is not settled");
            let winner = self.winner_index();
            let index = self.bids.iter().position(|item| item.bidder == bidder).expect("no commitment");
            let bid = &mut self.bids[index];
            assert!(winner == Some(index) || bid.revealed_amount.is_none(), "only winner or unrevealed deposits go to seller");
            assert!(!bid.claimed, "deposit already claimed");
            bid.claimed = true;
            match proof {
                Some(proof) => bid.deposit.withdraw_confidential(proof),
                None => bid.deposit.withdraw_all(),
            }
        }
    }

    impl SeanceAuction {
        fn winner_index(&self) -> Option<usize> {
            self.bids.iter().enumerate().filter_map(|(index, bid)| bid.revealed_amount.map(|amount| (index, amount, bid.sequence)))
                .max_by(|(_, left, left_sequence), (_, right, right_sequence)| left.cmp(right).then_with(|| right_sequence.cmp(left_sequence)))
                .map(|(index, _, _)| index)
        }
    }
}
