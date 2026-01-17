ALTER TABLE `reviews` ADD `helpfulVotes` int DEFAULT 0;--> statement-breakpoint
ALTER TABLE `reviews` ADD `verifiedBooking` int DEFAULT 0;--> statement-breakpoint
ALTER TABLE `reviews` ADD `photos` text;--> statement-breakpoint
ALTER TABLE `reviews` ADD `artistResponse` text;--> statement-breakpoint
ALTER TABLE `reviews` ADD `artistResponseDate` timestamp;