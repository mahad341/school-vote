var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';
export var SystemStatus;
(function (SystemStatus) {
    SystemStatus["ENABLED"] = "enabled";
    SystemStatus["DISABLED"] = "disabled";
    SystemStatus["MAINTENANCE"] = "maintenance";
})(SystemStatus || (SystemStatus = {}));
let SystemSetting = class SystemSetting {
    // Static methods for common settings
    static async getSystemStatus() {
        // This would be implemented in a service/repository
        return SystemStatus.ENABLED;
    }
    static async isVotingEnabled() {
        // This would be implemented in a service/repository
        return true;
    }
    static async getMaxVotesPerHour() {
        // This would be implemented in a service/repository
        return 1000;
    }
};
__decorate([
    PrimaryGeneratedColumn('uuid'),
    __metadata("design:type", String)
], SystemSetting.prototype, "id", void 0);
__decorate([
    Column({ unique: true, length: 100 }),
    __metadata("design:type", String)
], SystemSetting.prototype, "key", void 0);
__decorate([
    Column({ length: 255 }),
    __metadata("design:type", String)
], SystemSetting.prototype, "value", void 0);
__decorate([
    Column({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], SystemSetting.prototype, "description", void 0);
__decorate([
    Column({ type: 'varchar', length: 50, nullable: true }),
    __metadata("design:type", String)
], SystemSetting.prototype, "category", void 0);
__decorate([
    Column({ default: true }),
    __metadata("design:type", Boolean)
], SystemSetting.prototype, "isActive", void 0);
__decorate([
    Column({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], SystemSetting.prototype, "metadata", void 0);
__decorate([
    CreateDateColumn(),
    __metadata("design:type", Date)
], SystemSetting.prototype, "createdAt", void 0);
__decorate([
    UpdateDateColumn(),
    __metadata("design:type", Date)
], SystemSetting.prototype, "updatedAt", void 0);
SystemSetting = __decorate([
    Entity('system_settings')
], SystemSetting);
export { SystemSetting };
