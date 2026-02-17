import { LightningElement, api } from 'lwc';

export default class DataTable extends LightningElement {
    @api columns;
    @api data;
    @api sortBy;
    @api density = 'comfy';

    get tableClass() {
        const base = 'slds-table slds-table_bordered slds-table_cell-buffer';
        if (this.density === 'compact') {
            return `${base} slds-table_compact`;
        }
        return base;
    }

    handleSort(event) {
        this.dispatchEvent(new CustomEvent('sort', { detail: event.detail }));
    }
}
