/*
 * Copyright (c) 2016-2018 VMware, Inc. All Rights Reserved.
 * This software is released under MIT license.
 * The full license information can be found in LICENSE in the root directory of this project.
 */

import { ClrDatagridFilterInterface } from './filter.interface';
import { FilterStateInterface } from './filter.state.interface';

export interface SerializableFilter<T> extends ClrDatagridFilterInterface<T> {
    equals(state: SerializableFilter<T>): boolean;
    filterState: FilterStateInterface;
}
