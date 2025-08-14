import { NotificationContext } from "@timothyw/pat-common";

export class TemplateEngine {
    /**
     * Replace template variables in a string using context data
     * Supports nested object access like {{entity.name}} or {{user.settings.timezone}}
     */
    static replaceVariables(template: string, context: NotificationContext): string {
        return template.replace(/\{\{([^}]+)\}\}/g, (match, path) => {
            const trimmedPath = path.trim();
            const value = this.getNestedValue(context.variables, trimmedPath);
            
            // If value is not found, try entity data
            if (value === undefined || value === null) {
                const entityValue = this.getNestedValue(context.entityData, trimmedPath.replace(/^entity\./, ''));
                if (entityValue !== undefined && entityValue !== null) {
                    return this.formatValue(entityValue);
                }
            }
            
            return value !== undefined && value !== null ? this.formatValue(value) : match;
        });
    }
    
    /**
     * Get nested value from object using dot notation
     */
    private static getNestedValue(obj: any, path: string): any {
        return path.split('.').reduce((current, key) => {
            return current && current[key] !== undefined ? current[key] : undefined;
        }, obj);
    }
    
    /**
     * Format value for display in notifications
     */
    private static formatValue(value: any): string {
        if (value instanceof Date) {
            return value.toLocaleString();
        }
        
        if (typeof value === 'boolean') {
            return value ? 'Yes' : 'No';
        }
        
        if (typeof value === 'object' && value !== null) {
            return JSON.stringify(value);
        }
        
        return String(value);
    }
    
    /**
     * Extract variable names from a template string
     */
    static extractVariables(template: string): string[] {
        const matches = template.match(/\{\{([^}]+)\}\}/g);
        if (!matches) return [];
        
        return matches.map(match => {
            const path = match.replace(/\{\{|\}\}/g, '').trim();
            return path;
        });
    }
    
    /**
     * Validate that all required variables are available in context
     */
    static validateTemplate(template: string, context: NotificationContext): {
        valid: boolean;
        missingVariables: string[];
    } {
        const variables = this.extractVariables(template);
        const missingVariables: string[] = [];
        
        for (const variable of variables) {
            const value = this.getNestedValue(context.variables, variable);
            const entityValue = this.getNestedValue(context.entityData, variable.replace(/^entity\./, ''));
            
            if ((value === undefined || value === null) && 
                (entityValue === undefined || entityValue === null)) {
                missingVariables.push(variable);
            }
        }
        
        return {
            valid: missingVariables.length === 0,
            missingVariables
        };
    }
    
    /**
     * Create a context with common utility variables
     */
    static createBaseContext(entityData: any, additionalVariables: Record<string, any> = {}): Record<string, any> {
        const now = new Date();
        
        return {
            entity: entityData,
            now: now,
            today: now.toDateString(),
            currentTime: now.toLocaleTimeString(),
            ...additionalVariables
        };
    }
    
    /**
     * Calculate time-based variables like "5 minutes before due"
     */
    static calculateTimeVariables(entityData: any): Record<string, any> {
        const variables: Record<string, any> = {};
        
        if (entityData.dueDate) {
            const dueDate = new Date(entityData.dueDate);
            const now = new Date();
            const timeDiff = dueDate.getTime() - now.getTime();
            
            variables.timeUntilDue = this.formatTimeDuration(timeDiff);
            variables.isOverdue = timeDiff < 0;
            variables.dueIn = Math.abs(timeDiff);
            variables.dueDateFormatted = dueDate.toLocaleString();
        }
        
        if (entityData.rolloverTime) {
            // For habits with rollover time
            const today = new Date();
            const [hours, minutes] = entityData.rolloverTime.split(':').map(Number);
            const rolloverToday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), hours, minutes);
            
            const timeUntilRollover = rolloverToday.getTime() - Date.now();
            variables.timeUntilRollover = this.formatTimeDuration(timeUntilRollover);
            variables.rolloverTime = entityData.rolloverTime;
        }
        
        return variables;
    }
    
    /**
     * Format time duration for human readability
     */
    private static formatTimeDuration(milliseconds: number): string {
        const seconds = Math.abs(milliseconds) / 1000;
        const minutes = seconds / 60;
        const hours = minutes / 60;
        const days = hours / 24;
        
        if (days >= 1) {
            return `${Math.floor(days)} day${days >= 2 ? 's' : ''}`;
        } else if (hours >= 1) {
            return `${Math.floor(hours)} hour${hours >= 2 ? 's' : ''}`;
        } else if (minutes >= 1) {
            return `${Math.floor(minutes)} minute${minutes >= 2 ? 's' : ''}`;
        } else {
            return `${Math.floor(seconds)} second${seconds >= 2 ? 's' : ''}`;
        }
    }
}