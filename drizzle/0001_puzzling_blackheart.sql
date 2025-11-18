CREATE TABLE `anomalies` (
	`id` int AUTO_INCREMENT NOT NULL,
	`planogramId` int NOT NULL,
	`planogramPhotoId` int,
	`type` enum('misplaced','missing','excess','damaged') NOT NULL,
	`productId` int,
	`severity` enum('low','medium','high') NOT NULL DEFAULT 'medium',
	`description` text NOT NULL,
	`status` enum('open','resolved','ignored') NOT NULL DEFAULT 'open',
	`detectedAt` timestamp NOT NULL,
	`resolvedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `anomalies_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `planogramLocations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`storeId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`zone` varchar(100),
	`shelfCount` int NOT NULL DEFAULT 4,
	`shelfWidth` int NOT NULL DEFAULT 2000,
	`shelfHeight` int NOT NULL DEFAULT 300,
	`shelfDepth` int NOT NULL DEFAULT 400,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `planogramLocations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `planogramPhotos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`planogramId` int NOT NULL,
	`url` text NOT NULL,
	`fileKey` varchar(500) NOT NULL,
	`takenAt` timestamp NOT NULL,
	`uploadedBy` varchar(255),
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `planogramPhotos_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `planogramProducts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`planogramId` int NOT NULL,
	`productId` int NOT NULL,
	`shelfLevel` int NOT NULL,
	`positionX` int NOT NULL,
	`facings` int NOT NULL DEFAULT 1,
	`quantity` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `planogramProducts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `planograms` (
	`id` int AUTO_INCREMENT NOT NULL,
	`locationId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`version` int NOT NULL DEFAULT 1,
	`status` enum('draft','active','archived') NOT NULL DEFAULT 'draft',
	`salesTarget` int,
	`startDate` timestamp,
	`endDate` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `planograms_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `productCategories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`parentId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `productCategories_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `products` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sku` varchar(100) NOT NULL,
	`name` varchar(255) NOT NULL,
	`brand` varchar(255),
	`categoryId` int NOT NULL,
	`description` text,
	`photoUrl` text,
	`photoFileKey` varchar(500),
	`barcode` varchar(50),
	`unitPrice` int NOT NULL,
	`width` int,
	`height` int,
	`depth` int,
	`weight` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `products_id` PRIMARY KEY(`id`),
	CONSTRAINT `products_sku_unique` UNIQUE(`sku`)
);
--> statement-breakpoint
CREATE TABLE `recommendations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`planogramId` int NOT NULL,
	`type` enum('placement','assortment','pricing','stock') NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text NOT NULL,
	`priority` enum('low','medium','high') NOT NULL DEFAULT 'medium',
	`expectedImpact` text,
	`status` enum('pending','accepted','rejected','implemented') NOT NULL DEFAULT 'pending',
	`shareToken` varchar(64),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `recommendations_id` PRIMARY KEY(`id`),
	CONSTRAINT `recommendations_shareToken_unique` UNIQUE(`shareToken`)
);
--> statement-breakpoint
CREATE TABLE `salesForecasts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`storeId` int NOT NULL,
	`productId` int NOT NULL,
	`planogramId` int,
	`forecastDate` timestamp NOT NULL,
	`predictedQuantity` int NOT NULL,
	`predictedRevenue` int NOT NULL,
	`confidence` int NOT NULL DEFAULT 80,
	`algorithm` varchar(100),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `salesForecasts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `stockHistory` (
	`id` int AUTO_INCREMENT NOT NULL,
	`storeId` int NOT NULL,
	`productId` int NOT NULL,
	`quantity` int NOT NULL,
	`movementType` enum('in','out','adjustment','sale') NOT NULL,
	`recordedAt` timestamp NOT NULL,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `stockHistory_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `storePhotos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`storeId` int NOT NULL,
	`url` text NOT NULL,
	`fileKey` varchar(500) NOT NULL,
	`description` text,
	`isPrimary` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `storePhotos_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `stores` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`address` text NOT NULL,
	`city` varchar(100) NOT NULL,
	`latitude` decimal(10,7),
	`longitude` decimal(10,7),
	`surface` int,
	`phone` varchar(20),
	`managerName` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `stores_id` PRIMARY KEY(`id`)
);
