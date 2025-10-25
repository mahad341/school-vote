var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { Vote } from './Vote.js';
export var CandidateStatus;
(function (CandidateStatus) {
    CandidateStatus["ACTIVE"] = "active";
    CandidateStatus["WITHDRAWN"] = "withdrawn";
    CandidateStatus["DISQUALIFIED"] = "disqualified";
})(CandidateStatus || (CandidateStatus = {}));
let Candidate = class Candidate {
    // Virtual properties
    get fullName() {
        return `${this.firstName} ${this.lastName}`;
    }
    get isActive() {
        return this.status === CandidateStatus.ACTIVE;
    }
    // Methods
    addVote() {
        this.voteCount++;
    }
    updatePercentage(totalVotes) {
        if (totalVotes > 0) {
            this.votePercentage = parseFloat(((this.voteCount / totalVotes) * 100).toFixed(2));
        }
        else {
            this.votePercentage = 0;
        }
    }
    canReceiveVotes() {
        return this.isActive && this.post?.isVotingOpen;
    }
};
__decorate([
    PrimaryGeneratedColumn('uuid'),
    __metadata("design:type", String)
], Candidate.prototype, "id", void 0);
__decorate([
    Column({ length: 100 }),
    __metadata("design:type", String)
], Candidate.prototype, "firstName", void 0);
__decorate([
    Column({ length: 100 }),
    __metadata("design:type", String)
], Candidate.prototype, "lastName", void 0);
__decorate([
    Column({ length: 20, nullable: true }),
    __metadata("design:type", String)
], Candidate.prototype, "studentId", void 0);
__decorate([
    Column({ length: 255, nullable: true }),
    __metadata("design:type", String)
], Candidate.prototype, "email", void 0);
__decorate([
    Column({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], Candidate.prototype, "bio", void 0);
__decorate([
    Column({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], Candidate.prototype, "manifesto", void 0);
__decorate([
    Column({ nullable: true }),
    __metadata("design:type", String)
], Candidate.prototype, "photoUrl", void 0);
__decorate([
    Column({ nullable: true, length: 50 }),
    __metadata("design:type", String)
], Candidate.prototype, "house", void 0);
__decorate([
    Column({ nullable: true, length: 20 }),
    __metadata("design:type", String)
], Candidate.prototype, "class", void 0);
__decorate([
    Column({
        type: 'enum',
        enum: CandidateStatus,
        default: CandidateStatus.ACTIVE
    }),
    __metadata("design:type", String)
], Candidate.prototype, "status", void 0);
__decorate([
    Column({ default: 0 }),
    __metadata("design:type", Number)
], Candidate.prototype, "voteCount", void 0);
__decorate([
    Column({ type: 'numeric', precision: 5, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], Candidate.prototype, "votePercentage", void 0);
__decorate([
    Column({ type: 'int', nullable: true }),
    __metadata("design:type", Number)
], Candidate.prototype, "displayOrder", void 0);
__decorate([
    Column({ name: 'postId' }),
    __metadata("design:type", String)
], Candidate.prototype, "postId", void 0);
__decorate([
    ManyToOne('ElectionPost', 'candidates', { onDelete: 'CASCADE' }),
    JoinColumn({ name: 'postId' }),
    __metadata("design:type", Function)
], Candidate.prototype, "post", void 0);
__decorate([
    CreateDateColumn(),
    __metadata("design:type", Date)
], Candidate.prototype, "createdAt", void 0);
__decorate([
    UpdateDateColumn(),
    __metadata("design:type", Date)
], Candidate.prototype, "updatedAt", void 0);
__decorate([
    OneToMany(() => Vote, (vote) => vote.candidate),
    __metadata("design:type", Array)
], Candidate.prototype, "votes", void 0);
Candidate = __decorate([
    Entity('candidates')
], Candidate);
export { Candidate };
