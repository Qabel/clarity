/*
 * Copyright (c) 2016-2018 VMware, Inc. All Rights Reserved.
 * This software is released under MIT license.
 * The full license information can be found in LICENSE in the root directory of this project.
 */
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { DatagridPropertyComparator } from '../built-in/comparators/datagrid-property-comparator';
import { DatagridPropertyStringFilter } from '../built-in/filters/datagrid-property-string-filter';
import { DatagridStringFilterImpl } from '../built-in/filters/datagrid-string-filter-impl';
import { ClrDatagridStateInterface } from '../interfaces/state.interface';

import { FiltersProvider } from './filters';
import { Page } from './page';
import { Sort } from './sort';
import { StateDebouncer } from './state-debouncer.provider';
import { SerializableFilter } from '../interfaces/serializable.filter.interface';
import { StringFilterStateInterface } from '../interfaces/string.filter.state.interface';

/**
 * This provider aggregates state changes from the various providers of the Datagrid
 */
@Injectable()
export class StateProvider<T> {
    constructor(
        private filters: FiltersProvider<T>,
        private sort: Sort<T>,
        private page: Page,
        private debouncer: StateDebouncer
    ) { }

    /**
     * The Observable that lets other classes subscribe to global state changes
     */
    change: Observable<ClrDatagridStateInterface<T>> = this.debouncer.change.pipe(map(() => this.state));

    /*
       * By making this a getter, we open the possibility for a setter in the future.
       * It's been requested a couple times.
       */
    get state(): ClrDatagridStateInterface<T> {
        const state: ClrDatagridStateInterface<T> = {};
        if (this.page.size > 0) {
            state.page = { from: this.page.firstItem, to: this.page.lastItem, size: this.page.size };
        }
        if (this.sort.comparator) {
            if (this.sort.comparator instanceof DatagridPropertyComparator) {
                /*
                         * Special case for the default object property comparator,
                         * we give the property name instead of the actual comparator.
                         */
                state.sort = { by: (<DatagridPropertyComparator<T>>this.sort.comparator).prop, reverse: this.sort.reverse };
            } else {
                state.sort = { by: this.sort.comparator, reverse: this.sort.reverse };
            }
        }

        const activeFilters = this.filters.getActiveFilters();
        if (activeFilters.length > 0) {
            state.filters = [];
            for (const filter of activeFilters) {
                if (filter.filterState.type === 'BuiltinStringFilter') {
                    const stringFilterState = <StringFilterStateInterface>filter.filterState;
                    state.filters.push({
                        property: stringFilterState.property,
                        value: stringFilterState.value,
                    });
                }
            }
        }
        return state;
    }

    set state(state: ClrDatagridStateInterface<T>) {
        this.debouncer.changeStart();
        if (state.page) {
            this.page.size = state.page.size;
            this.page.current = Math.ceil(state.page.from / state.page.size) + 1;
        }
        if (state.sort) {
            if (typeof state.sort.by === 'string') {
                if (!(this.sort.comparator instanceof DatagridPropertyComparator)) {
                    this.sort.comparator = new DatagridPropertyComparator(state.sort.by);
                }
                if (this.sort.reverse !== state.sort.reverse) {
                    this.sort.toggle(this.sort.comparator);
                }
            } else {
                this.sort.comparator = state.sort.by;
                this.sort.reverse = state.sort.reverse;
            }
        }
        if (state.filters) {
            const activeFilters = this.filters.getActiveFilters();
            for (const filter of state.filters) {
                let filterObject: SerializableFilter<T>;
                if (filter.hasOwnProperty('property') && filter.hasOwnProperty('value')) {
                    const defaultFilterRepresentation = filter as { property: string; value: string };
                    const propertyStringFilter = new DatagridPropertyStringFilter(defaultFilterRepresentation.property);
                    const stringFilter = new DatagridStringFilterImpl(propertyStringFilter);
                    stringFilter.value = defaultFilterRepresentation.value;
                    filterObject = stringFilter;
                } else {
                    filterObject = filter as SerializableFilter<T>;
                }
                const existing = activeFilters.findIndex(value => value.compatibleToState(filterObject.filterState));
                if (existing !== -1) {
                    activeFilters.splice(existing, 1);
                } else {
                    this.filters.add(filterObject);
                }
            }
            activeFilters.forEach(filter => this.filters.remove(filter));
        }

        this.debouncer.changeDone();
    }
}
