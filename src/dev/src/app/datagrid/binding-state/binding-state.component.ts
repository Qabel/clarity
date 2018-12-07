import { Component, OnInit } from '@angular/core';
import { Inventory, FetchResult } from '../inventory/inventory';
import { User } from '../inventory/user';
import { ClrDatagridStateInterface } from '@clr/angular';
import { ColorFilter } from '../utils/color-filter';

@Component({
    selector: 'app-binding-state',
    providers: [Inventory],
    templateUrl: './binding-state.component.html',
    styleUrls: ['./binding-state.component.css']
})
export class BindingStateComponent {

    users: User[];
    total: number;
    loading: boolean = true;
    colorFilter = new ColorFilter();
    state: ClrDatagridStateInterface;
    constructor(private inventory: Inventory) {
        this.state =
            {
                page: { from: 0, to: 8, size: 10 },
                sort: { by: "pokemon", reverse: false },
                filters: [
                    { property: "name", value: "sampleName" },
                    { property: "creation", value: "sampleDate" }]
            };       
        this.colorFilter.toggleColor('Indigo');
        this.colorFilter.toggleColor('Red');
        this.state.filters.push(this.colorFilter);
        inventory.size = 103;
        this.inventory.latency = 500;
        inventory.reset();
    }

    refresh() {
        this.loading = true;
        const filters: { [prop: string]: any[] } = {};
        if (this.state.filters) {
            for (const filter of this.state.filters) {
                const { property, value } = <{ property: string; value: string }>filter;
                if (property && value) {
                    filters[property] = [value];
                }
            }
        }
        this.inventory
            .filter(filters)
            .sort(<{ by: string; reverse: boolean }>this.state.sort)
            .fetch(this.state.page.from, this.state.page.size)
            .then((result: FetchResult) => {
                this.users = result.users;
                this.total = result.length;
                this.loading = false;
            });
    }
}
