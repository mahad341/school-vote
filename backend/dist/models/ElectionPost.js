var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { Vote } from './Vote.js';
export var PostType;
(function (PostType) {
    PostType["GENERAL"] = "general";
    PostType["HOUSE_SPECIFIC"] = "house_specific"; // Only students from specific houses can vote
})(PostType || (PostType = {}));
export var PostStatus;
(function (PostStatus) {
    PostStatus["ACTIVE"] = "active";
    PostStatus["INACTIVE"] = "inactive";
    PostStatus["COMPLETED"] = "completed";
})(PostStatus || (PostStatus = {}));
let ElectionPost = class ElectionPost {
    // Virtual properties
    get isActive() {
        return this.status === PostStatus.ACTIVE;
    }
    get isVotingOpen() {
        const now = new Date();
        return this.isActive &&
            !!this.votingStartsAt && !!this.votingEndsAt &&
            now >= this.votingStartsAt && now <= this.votingEndsAt;
    }
    get eligibleHousesArray() {
        return this.eligibleHouses ? JSON.parse(this.eligibleHouses) : [];
    }
    set eligibleHousesArray(houses) {
        this.eligibleHouses = JSON.stringify(houses);
    }
    // Methods
    canUserVote(userHouse) {
        if (!this.isVotingOpen)
            return false;
        if (this.type === PostType.GENERAL)
            return true;
        if (this.type === PostType.HOUSE_SPECIFIC && userHouse) {
            return this.eligibleHousesArray.includes(userHouse);
        }
        return false;
    }
    addVote() {
        this.totalVotes++;
    }
};
__decorate([
    PrimaryGeneratedColumn('uuid'),
    __metadata("design:type", String)
], ElectionPost.prototype, "id", void 0);
__decorate([
    Column({ length: 100 }),
    __metadata("design:type", String)
], ElectionPost.prototype, "title", void 0);
__decorate([
    Column({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], ElectionPost.prototype, "description", void 0);
__decorate([
    Column({
        type: 'enum',
        enum: PostType,
        default: PostType.GENERAL
    }),
    __metadata("design:type", String)
], ElectionPost.prototype, "type", void 0);
__decorate([
    Column({
        type: 'enum',
        enum: PostStatus,
        default: PostStatus.INACTIVE
    }),
    __metadata("design:type", String)
], ElectionPost.prototype, "status", void 0);
__decorate([
    Column({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], ElectionPost.prototype, "eligibleHouses", void 0);
__decorate([
    Column({ default: 1 }),
    __metadata("design:type", Number)
], ElectionPost.prototype, "maxVotes", void 0);
__decorate([
    Column({ type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], ElectionPost.prototype, "votingStartsAt", void 0);
__decorate([
    Column({ type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], ElectionPost.prototype, "votingEndsAt", void 0);
__decorate([
    Column({ default: 0 }),
    __metadata("design:type", Number)
], ElectionPost.prototype, "totalVotes", void 0);
__decorate([
    Column({ type: 'int', nullable: true }),
    __metadata("design:type", Number)
], ElectionPost.prototype, "displayOrder", void 0);
__decorate([
    CreateDateColumn(),
    __metadata("design:type", Date)
], ElectionPost.prototype, "createdAt", void 0);
__decorate([
    UpdateDateColumn(),
    __metadata("design:type", Date)
], ElectionPost.prototype, "updatedAt", void 0);
__decorate([
    OneToMany('Candidate', 'post'),
    __metadata("design:type", Array)
], ElectionPost.prototype, "candidates", void 0);
__decorate([
    OneToMany(() => Vote, (vote) => vote.post),
    __metadata("design:type", Array)
], ElectionPost.prototype, "votes", void 0);
ElectionPost = __decorate([
    Entity('election_posts')
], ElectionPost);
export { ElectionPost };
