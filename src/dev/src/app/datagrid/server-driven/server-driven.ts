/*
 * Copyright (c) 2016-2018 VMware, Inc. All Rights Reserved.
 * This software is released under MIT license.
 * The full license information can be found in LICENSE in the root directory of this project.
 */
import { Component } from '@angular/core';
import { ClrDatagridStateInterface } from '@clr/angular';
import { FetchResult, Inventory } from '../inventory/inventory';
import { User } from '../inventory/user';

@Component({
    selector: 'clr-datagrid-server-driven-demo',
    providers: [Inventory],
    templateUrl: 'server-driven.html',
    styleUrls: ['../datagrid.demo.scss'],
})
export class DatagridServerDrivenDemo {
    users: User[];
    total: number;
    loading: boolean = true;
    state: ClrDatagridStateInterface =
        {
            page: { from: 0, to: 8, size: 10 },
            sort: { by: "pokemon", reverse: false },
            filters: [{ property: "name", value: "sampleName" },{ property: "creation", value: "sampleDate" }]
        };
    constructor(private inventory: Inventory) {
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
                filters[property] = [value];
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
