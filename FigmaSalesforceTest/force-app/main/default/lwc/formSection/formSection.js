import { LightningElement, api } from 'lwc';

export default class FormSection extends LightningElement {
    @api mode = 'edit';
    @api required = false;
    @api layout = 'stacked';

    get formClass() {
        const base = 'slds-form';
        if (this.layout === 'inline') {
            return `${base} slds-form_inline`;
        } else if (this.layout === 'horizontal') {
            return `${base} slds-form_horizontal`;
        }
        return `${base} slds-form_stacked`;
    }

    get isReadOnly() {
        return this.mode === 'view';
    }

    handleSubmit(event) {
        event.preventDefault();
        this.dispatchEvent(new CustomEvent('submit'));
    }
}
