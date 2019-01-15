import { Component, OnInit, ViewChild } from '@angular/core';
import { FetchResult, Inventory } from '../inventory/inventory';
import { User } from '../inventory/user';
import { ClrDatagridStateInterface } from '@clr/angular';
import { ColorFilter } from '../utils/color-filter';
import { ListFilter } from '../utils/list-filter';
import { NumberIntervalFilter } from '../utils/number-interval-filter';
import { DateIntervalFilter } from '../utils/date-interval-filter';

@Component({
  selector: 'app-binding-state',
  providers: [Inventory],
  templateUrl: './binding-state.component.html',
  styleUrls: ['./binding-state.component.css'],
})
export class BindingStateComponent implements OnInit {
  users: User[];
  total: number;
  loading: boolean = true;
  state: ClrDatagridStateInterface;
  genderList = ['FEMALE', 'MALE', 'OTHER'];

  @ViewChild('creationFilter') dateFilter: DateIntervalFilter;
  @ViewChild('creationFilter2') dateFilter2: DateIntervalFilter;
  @ViewChild('colorFilter') filter: ColorFilter;
  @ViewChild('colorFilter2') filter2: ColorFilter;
  @ViewChild('genderFilter') listFilter: ListFilter;
  @ViewChild('genderFilter2') listFilter2: ListFilter;
  @ViewChild('ageFilter') numberIntervalFilter: ListFilter;
  @ViewChild('ageFilter2') numberIntervalFilter2: ListFilter;

  constructor(private inventory: Inventory) {
    this.inventory.size = 103;
    this.inventory.latency = 500;
    this.inventory.reset();
  }

  ngOnInit() {
    const dateFilter = new DateIntervalFilter();
    dateFilter.setId(this.dateFilter.id);
    dateFilter.from = new Date();
    dateFilter.to = new Date();

    const dateFilter2 = new DateIntervalFilter();
    dateFilter2.setId(this.dateFilter2.id);
    dateFilter2.from = new Date();
    dateFilter2.to = new Date();

    const colorFilter = new ColorFilter();
    colorFilter.setId(this.filter.id);
    colorFilter.toggleColor('Indigo');
    colorFilter.toggleColor('Red');

    const colorFilter2 = new ColorFilter();
    colorFilter2.setId(this.filter2.id);
    colorFilter2.toggleColor('White');
    colorFilter2.toggleColor('Black');

    const genderFilter = new ListFilter();
    genderFilter.setId(this.listFilter.id);
    genderFilter.selectedValue = 'MALE';
    this.listFilter.values = this.genderList;

    const genderFilter2 = new ListFilter();
    genderFilter2.setId(this.listFilter2.id);
    genderFilter2.selectedValue = 'FEMALE';
    this.listFilter2.values = this.genderList;

    const ageFilter = new NumberIntervalFilter();
    ageFilter.setId(this.numberIntervalFilter.id);
    ageFilter.from = 3;
    ageFilter.to = 36;

    const ageFilter2 = new NumberIntervalFilter();
    ageFilter2.setId(this.numberIntervalFilter2.id);
    ageFilter2.from = 5;
    ageFilter2.to = 25;

    this.state = {
      page: { from: 0, to: 8, size: 10 },
      sort: { by: 'pokemon', reverse: false },
      filters: [
        { property: 'name', value: 'Alica' },
        dateFilter,
        dateFilter2,
        colorFilter,
        colorFilter2,
        genderFilter,
        genderFilter2,
        ageFilter,
        ageFilter2,
      ],
    };
  }

  refresh(): void {
    this.loading = true;
    const filters: { [prop: string]: any[] } = this.extractFilters();

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

  private extractFilters(): { [prop: string]: any[] } {
    const filters: { [prop: string]: any[] } = {};
    if (this.state.filters) {
      for (const filter of this.state.filters) {
        const { property, value } = <{ property: string; value: string }>filter;
        if (property && value) {
          filters[property] = [value];
        }
      }
    }
    return filters;
  }
}
