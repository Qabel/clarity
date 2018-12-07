/*
 * Copyright (c) 2016-2018 VMware, Inc. All Rights Reserved.
 * This software is released under MIT license.
 * The full license information can be found in LICENSE in the root directory of this project.
 */
import { OnDestroy } from '@angular/core';
import { ClrDatagridFilterInterface } from '../interfaces/filter.interface';
import { FiltersProvider, RegisteredFilter } from '../providers/filters';
import { SerializableFilter } from '../interfaces/serializable.filter.interface';

export abstract class DatagridFilterRegistrar<T, F extends SerializableFilter<T>> implements OnDestroy {
    constructor(private filters: FiltersProvider<T>) { }

    public registered: RegisteredFilter<T, F>;

    public get filter(): F {
        return this.registered && this.registered.filter;
    }

    public setFilter(filter: F | RegisteredFilter<T, F>) {
        // If we previously had another filter, we unregister it
        this.deleteFilter();
        if (filter instanceof RegisteredFilter) {
            this.registered = filter;
        } else if (filter) {
            const existingFilter = this.filters.getRegisteredFilter(filter);
            if (existingFilter) {
                filter.filterState = existingFilter.filter.filterState;
                this.filters.remove(existingFilter.filter);
            }
            this.registered = this.filters.add(filter);


        }
    }

    public deleteFilter() {
        if (this.registered) {
            this.registered.unregister();
            delete this.registered;
        }
    }

    public ngOnDestroy(): void {
        this.deleteFilter();
    }
}
