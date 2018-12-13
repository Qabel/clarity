import { Component, OnInit, ViewChild } from '@angular/core';
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
export class BindingStateComponent implements OnInit {

    users: User[];
    total: number;
    loading: boolean = true;
    state: ClrDatagridStateInterface;

    @ViewChild("colorFilter") filter: ColorFilter;
    @ViewChild("colorFilter2") filter2: ColorFilter;

    constructor(private inventory: Inventory) {
      this.inventory.size = 103;
      this.inventory.latency = 500;
      this.inventory.reset();
    }

    ngOnInit() {
      const colorFilter2 = new ColorFilter();
      colorFilter2.setId(this.filter2.id);
      colorFilter2.toggleColor('White');
      colorFilter2.toggleColor('Black');

      const colorFilter = new ColorFilter();
      colorFilter.setId(this.filter.id);
      colorFilter.toggleColor('Indigo');
      colorFilter.toggleColor('Red');

      this.state =
      {
          page: { from: 0, to: 8, size: 10 },
          sort: { by: "pokemon", reverse: false },
          filters: [
              { property: "name", value: "sampleName" },
              { property: "creation", value: "sampleDate" },
              colorFilter,
              colorFilter2]
      };
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
