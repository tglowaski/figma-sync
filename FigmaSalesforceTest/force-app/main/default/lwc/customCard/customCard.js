import { LightningElement, api } from 'lwc';

export default class CustomCard extends LightningElement {
    @api variant = 'default';
    @api size = 'medium';
    @api title;
    @api showFooter = false;

    get cardClass() {
        const base = 'slds-card slds-p-around_medium';
        if (this.variant === 'brand') {
            return `${base} slds-theme_shade`;
        } else if (this.variant === 'outline') {
            return `${base} slds-border_bottom`;
        }
        return base;
    }

    get sizeClass() {
        if (this.size === 'small') {
            return 'slds-p-around_small';
        } else if (this.size === 'large') {
            return 'slds-p-around_large';
        }
        return 'slds-p-around_medium';
    }

    handleAction() {
        this.dispatchEvent(new CustomEvent('action'));
    }
}
