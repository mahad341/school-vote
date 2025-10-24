var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { User } from './User.js';
export var VoteStatus;
(function (VoteStatus) {
    VoteStatus["CAST"] = "cast";
    VoteStatus["VERIFIED"] = "verified";
    VoteStatus["INVALID"] = "invalid";
})(VoteStatus || (VoteStatus = {}));
let Vote = class Vote {
    // Virtual properties
    get isValid() {
        return this.status === VoteStatus.VERIFIED;
    }
    // Methods
    verify() {
        this.status = VoteStatus.VERIFIED;
    }
    invalidate() {
        this.status = VoteStatus.INVALID;
    }
    generateVerificationHash() {
        // Simple hash for vote integrity (in production, use cryptographic hash)
        const data = `${this.userId}-${this.postId}-${this.candidateId}-${this.createdAt.getTime()}`;
        this.verificationHash = Buffer.from(data).toString('base64');
        return this.verificationHash;
    }
    validateIntegrity() {
        if (!this.verificationHash)
            return false;
        const expectedHash = this.generateVerificationHash();
        return this.verificationHash === expectedHash;
    }
};
__decorate([
    PrimaryGeneratedColumn('uuid'),
    __metadata("design:type", String)
], Vote.prototype, "id", void 0);
__decorate([
    Column({ name: 'userId' }),
    __metadata("design:type", String)
], Vote.prototype, "userId", void 0);
__decorate([
    Column({ name: 'postId' }),
    __metadata("design:type", String)
], Vote.prototype, "postId", void 0);
__decorate([
    Column({ name: 'candidateId' }),
    __metadata("design:type", String)
], Vote.prototype, "candidateId", void 0);
__decorate([
    Column({
        type: 'enum',
        enum: VoteStatus,
        default: VoteStatus.CAST
    }),
    __metadata("design:type", String)
], Vote.prototype, "status", void 0);
__decorate([
    Column({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], Vote.prototype, "verificationHash", void 0);
__decorate([
    Column({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], Vote.prototype, "metadata", void 0);
__decorate([
    Column({ type: 'inet', nullable: true }),
    __metadata("design:type", String)
], Vote.prototype, "ipAddress", void 0);
__decorate([
    Column({ length: 500, nullable: true }),
    __metadata("design:type", String)
], Vote.prototype, "userAgent", void 0);
__decorate([
    CreateDateColumn(),
    __metadata("design:type", Date)
], Vote.prototype, "createdAt", void 0);
__decorate([
    ManyToOne(() => User, (user) => user.votes, { onDelete: 'CASCADE' }),
    JoinColumn({ name: 'userId' }),
    __metadata("design:type", User)
], Vote.prototype, "user", void 0);
__decorate([
    ManyToOne('ElectionPost', 'votes', { onDelete: 'CASCADE' }),
    JoinColumn({ name: 'postId' }),
    __metadata("design:type", Function)
], Vote.prototype, "post", void 0);
__decorate([
    ManyToOne('Candidate', 'votes', { onDelete: 'CASCADE' }),
    JoinColumn({ name: 'candidateId' }),
    __metadata("design:type", Function)
], Vote.prototype, "candidate", void 0);
Vote = __decorate([
    Entity('votes'),
    Index(['userId', 'postId'], { unique: true }) // One vote per user per post
    ,
    Index(['postId', 'candidateId']) // For result calculations
    ,
    Index(['createdAt']) // For audit trails
], Vote);
export { Vote };
