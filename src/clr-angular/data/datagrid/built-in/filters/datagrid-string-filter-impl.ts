/*
 * Copyright (c) 2016-2018 VMware, Inc. All Rights Reserved.
 * This software is released under MIT license.
 * The full license information can be found in LICENSE in the root directory of this project.
 */
import { Observable } from 'rxjs';
import { Subject } from 'rxjs';
import { ClrDatagridStringFilterInterface } from '../../interfaces/string-filter.interface';
import { DatagridPropertyStringFilter } from './datagrid-property-string-filter';
import { SerializableFilter } from '../../interfaces/serializable.filter.interface';
import { FilterStateInterface } from '../../interfaces/filter.state.interface';
import { StringFilterStateInterface } from '../../interfaces/string.filter.state.interface';

export class DatagridStringFilterImpl<T = any> implements SerializableFilter<T> {
    constructor(public filterFn: ClrDatagridStringFilterInterface<T>) {
        const datagridPropertyStringFilter = <DatagridPropertyStringFilter>filterFn;
        this._state =
            {
                type: 'BuiltinStringFilter',
                property: datagridPropertyStringFilter.prop,
                value: ''
            }
    }

    /**
     * The Observable required as part of the Filter interface
     */
    private _changes = new Subject<string>();
    private _state: StringFilterStateInterface;

    // We do not want to expose the Subject itself, but the Observable which is read-only
    public get changes(): Observable<string> {
        return this._changes.asObservable();
    }

    /**
     * Raw input value
     */
    private _rawValue: string = '';
    public get value(): string {
        return this._rawValue;
    }
    /**
     * Input value converted to lowercase
     */
    private _lowerCaseValue: string = '';
    public get lowerCaseValue() {
        return this._lowerCaseValue;
    }
    /**
     * Common setter for the input value
     */
    public set value(value: string) {
        if (!value) {
            value = '';
        }
        if (value !== this._rawValue) {
            this._rawValue = value;
            this._lowerCaseValue = value.toLowerCase().trim();
            this._state.value = this.value;
            this._changes.next(value);
        }       
    }

    public get filterState(): StringFilterStateInterface {
        return this._state;
    }

    public set filterState(state: StringFilterStateInterface) {
        this._state = state;
        this._rawValue = state.value;
        this._changes.next();
    }

    /**
     * Indicates if the filter is currently active, meaning the input is not empty
     */
    public isActive(): boolean {
        return !!this.value;
    }

    /**
     * Tests if an item matches a search text
     */
    public accepts(item: T): boolean {
        // We always test with the lowercase value of the input, to stay case insensitive
        return this.filterFn.accepts(item, this.lowerCaseValue);
    }

    /**
     * Compare objects by properties
     */
    public compatibleToState(state: FilterStateInterface): boolean {
        if (state && state.type === this._state.type) {
            const stringState = <StringFilterStateInterface>state;
            return stringState.property === this._state.property;
        } else {
            return false;
        }
    }
}
