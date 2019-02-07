/*
 * Copyright (c) 2016-2018 VMware, Inc. All Rights Reserved.
 * This software is released under MIT license.
 * The full license information can be found in LICENSE in the root directory of this project.
 */
import { ChangeDetectionStrategy, Component, Input, Renderer2 } from '@angular/core';
import { Observable, Subject } from 'rxjs';

import { DatagridPropertyStringFilter } from './built-in/filters/datagrid-property-string-filter';
import { DatagridStringFilterImpl } from './built-in/filters/datagrid-string-filter-impl';
import { ClrDatagrid } from './datagrid';
import { DatagridDisplayMode } from './enums/display-mode.enum';
import { TestContext } from './helpers.spec';
import { ClrDatagridComparatorInterface } from './interfaces/comparator.interface';
import { ClrDatagridStateInterface } from './interfaces/state.interface';
import { ColumnToggleButtonsService } from './providers/column-toggle-buttons.service';
import { MockDisplayModeService } from './providers/display-mode.mock';
import { DisplayModeService } from './providers/display-mode.service';
import { FiltersProvider } from './providers/filters';
import { ExpandableRowsCount } from './providers/global-expandable-rows';
import { HideableColumnService } from './providers/hideable-column.service';
import { Items } from './providers/items';
import { Page } from './providers/page';
import { RowActionService } from './providers/row-action-service';
import { Selection, SelectionType } from './providers/selection';
import { Sort } from './providers/sort';
import { StateDebouncer } from './providers/state-debouncer.provider';
import { StateProvider } from './providers/state.provider';
import { TableSizeService } from './providers/table-size.service';
import { DatagridRenderOrganizer } from './render/render-organizer';
import { SerializableFilter } from './interfaces/serializable.filter.interface';
import { FilterStateInterface } from './interfaces/filter.state.interface';
import { ListFilter } from '../../../dev/src/app/datagrid/utils/list-filter';
import { ColorFilter } from '../../../dev/src/app/datagrid/utils/color-filter';
import { DateIntervalFilter } from '../../../dev/src/app/datagrid/utils/date-interval-filter';
import { NumberIntervalFilter } from '../../../dev/src/app/datagrid/utils/number-interval-filter';

@Component({
  template: `
    <clr-datagrid *ngIf="!destroy"
                  [clrDgState]="state"
                  [(clrDgSelected)]="selected" [clrDgLoading]="loading"
                  (clrDgRefresh)="refresh($event)"
                  (clrDgStateChange)="stateChange($event)"
    >
      <clr-dg-column>
        First
        <clr-dg-filter *ngIf="filter" [clrDgFilter]="testFilter"></clr-dg-filter>
      </clr-dg-column>
      <clr-dg-column>Second</clr-dg-column>

      <clr-dg-row *clrDgItems="let item of items">
        <clr-dg-cell>{{item}}</clr-dg-cell>
        <clr-dg-cell>{{item * item}}</clr-dg-cell>
      </clr-dg-row>

      <clr-dg-footer>{{items.length}} items</clr-dg-footer>
    </clr-datagrid>
  `,
})
class FullTest {
  items = [1, 2, 3];

  loading = false;
  selected: number[];

  state: ClrDatagridStateInterface;

  nbRefreshed = 0;
  latestState: ClrDatagridStateInterface;
  latestRefreshState: ClrDatagridStateInterface;

  fakeLoad = false;

  // ClrDatagridFilterInterface needed to test the non-emission of stateChange on destroy, even with an active filter
  filter = false;
  testFilter = new TestFilter();

  destroy = false;

  stateChange(state: ClrDatagridStateInterface) {
    this.nbRefreshed++;
    this.latestState = state;
    this.loading = this.fakeLoad;
  }

  refresh(state: ClrDatagridStateInterface) {
    this.latestRefreshState = state;
  }
}

@Component({
  template: `
    <clr-datagrid>
        <clr-dg-column>First</clr-dg-column>
        <clr-dg-column>Second</clr-dg-column>
    
        <clr-dg-row *ngFor="let item of items">
            <clr-dg-cell>{{item}}</clr-dg-cell>
            <clr-dg-cell>{{item * item}}</clr-dg-cell>
        </clr-dg-row>
    
        <clr-dg-footer>{{items.length}} items</clr-dg-footer>
    </clr-datagrid>
`,
})
class NgForTest {
  items = [1, 2, 3];
}

// Have to wrap the OnPush component otherwise change detection doesn't run.
// The secret here is OnPush only updates on input changes, hence the wrapper.
@Component({
  template: `
    <multi-select-test [items]="items" [selected]="selected"></multi-select-test>
    `,
})
class OnPushTest {
  items = [1, 2, 3];
  selected: any[] = [];
}

@Component({
  selector: 'multi-select-test',
  template: `
    <clr-datagrid [(clrDgSelected)]="selected">
        <clr-dg-column>First</clr-dg-column>
        <clr-dg-column>Second</clr-dg-column>
    
        <clr-dg-row *clrDgItems="let item of items;" [clrDgItem]="item">
            <clr-dg-cell>{{item}}</clr-dg-cell>
            <clr-dg-cell>{{item * item}}</clr-dg-cell>
        </clr-dg-row>
    </clr-datagrid>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class MultiSelectionTest {
  @Input() items: any[] = [];
  @Input() selected: any[] = [];
}

@Component({
  template: `
    <clr-datagrid [(clrDgSingleSelected)]="selected">
        <clr-dg-column>First</clr-dg-column>
        <clr-dg-column>Second</clr-dg-column>
    
        <clr-dg-row *clrDgItems="let item of items;" [clrDgItem]="item">
            <clr-dg-cell>{{item}}</clr-dg-cell>
            <clr-dg-cell>{{item * item}}</clr-dg-cell>
        </clr-dg-row>
    
        <clr-dg-footer (click)="selected = null">{{selected}}</clr-dg-footer>
    </clr-datagrid>
`,
})
class SingleSelectionTest {
  items = [1, 2, 3];
  selected: any;
}

@Component({
  template: `
    <clr-datagrid>
        <clr-dg-column>First</clr-dg-column>
        <clr-dg-column>Second</clr-dg-column>
    
        <clr-dg-row *clrDgItems="let item of items;">
        
            <clr-dg-action-overflow *ngIf="item > showIfGreaterThan">
                <button class="action-item">Edit</button>
            </clr-dg-action-overflow>
                
            <clr-dg-cell>{{item}}</clr-dg-cell>
            <clr-dg-cell>{{item * item}}</clr-dg-cell>
        </clr-dg-row>
    
        <clr-dg-footer>{{items.length}} items</clr-dg-footer>
    </clr-datagrid>
`,
})
class ActionableRowTest {
  items = [1, 2, 3];
  showIfGreaterThan = 0;
}

@Component({
  template: `
    <clr-datagrid>
        <clr-dg-column>First</clr-dg-column>
        <clr-dg-column>Second</clr-dg-column>
    
        <clr-dg-row *clrDgItems="let item of items;" [clrDgItem]="item">
            <clr-dg-cell>{{item}}</clr-dg-cell>
            <clr-dg-cell>{{item * item}}</clr-dg-cell>
            <ng-template [ngIf]="expandable">
                <clr-dg-row-detail *clrIfExpanded>Detail</clr-dg-row-detail>
            </ng-template>
        </clr-dg-row>
    
        <clr-dg-footer>{{items.length}} items</clr-dg-footer>
    </clr-datagrid>
`,
})
class ExpandableRowTest {
  items = [1, 2, 3];
  expandable = true;
}

@Component({
  template: `
        <clr-datagrid>
            <clr-dg-column>First</clr-dg-column>
            <clr-dg-column>Second</clr-dg-column>

            <clr-dg-row *clrDgItems="let item of items; index as i">
                <clr-dg-action-overflow *ngIf="action && i === 1">
                    <button class="action-item">Edit</button>
                </clr-dg-action-overflow>
                <clr-dg-cell>{{item}}</clr-dg-cell>
                <clr-dg-cell>{{item * item}}</clr-dg-cell>
                <ng-template [ngIf]="expandable && i === 1">
                    <clr-dg-row-detail *clrIfExpanded>Detail</clr-dg-row-detail>
                </ng-template>
            </clr-dg-row>

            <clr-dg-footer>{{items.length}} items</clr-dg-footer>
        </clr-datagrid>
    `,
})
class ChocolateClrDgItemsTest {
  items = [1, 2, 3];
  action = false;
  expandable = false;
}

@Component({
  template: `
        <clr-datagrid>
            <clr-dg-column>First</clr-dg-column>
            <clr-dg-column>Second</clr-dg-column>

            <clr-dg-row *ngFor="let item of items; index as i">
                <clr-dg-action-overflow *ngIf="action && i === 1">
                    <button class="action-item">Edit</button>
                </clr-dg-action-overflow>
                <clr-dg-cell>{{item}}</clr-dg-cell>
                <clr-dg-cell>{{item * item}}</clr-dg-cell>
                <ng-template [ngIf]="expandable && i === 1">
                    <clr-dg-row-detail *clrIfExpanded>Detail</clr-dg-row-detail>
                </ng-template>
            </clr-dg-row>

            <clr-dg-footer>{{items.length}} items</clr-dg-footer>
        </clr-datagrid>
    `,
})
class ChocolateNgForTest {
  items = [1, 2, 3];
  action = false;
  expandable = false;
}

class TestComparator implements ClrDatagridComparatorInterface<number> {
  compare(a: number, b: number): number {
    return 0;
  }
}

class TestFilter implements SerializableFilter<number> {
  public id;

  constructor() {
    this.id = Math.random().toString();
    this.filterState = { type: 'TestFilter' };
  }

  isActive(): boolean {
    return true;
  }

  accepts(n: number): boolean {
    return true;
  }

  changes = new Subject<boolean>();

  filterState: FilterStateInterface;

  equals(state: TestFilter): boolean {
    return this.filterState.type === state.filterState.type && this.id === state.id;
  }
}

class TestStringFilter implements SerializableFilter<number> {
  changes: Observable<any>;
  filterState: FilterStateInterface;
  id: string;

  constructor() {
    this.id = Math.random().toString();
    this.filterState = { type: 'TestStringFilter' };
  }

  accepts(item: number): boolean {
    return true;
  }

  equals(state: TestStringFilter): boolean {
    return this.filterState.type === state.filterState.type && this.id === state.id;
  }

  isActive(): boolean {
    return true;
  }
}

@Component({
  selector: 'hidden-column-test',
  template: `
    <clr-datagrid>
        <clr-dg-column>
            <ng-container *clrDgHideableColumn="{hidden: true}">
                First
            </ng-container>
        </clr-dg-column>
        <clr-dg-column>Second</clr-dg-column>
    
        <clr-dg-row *ngFor="let item of items;">
            <clr-dg-cell>{{item}}</clr-dg-cell>
            <clr-dg-cell>{{item * item}}</clr-dg-cell>
        </clr-dg-row>
    </clr-datagrid>`,
})
class HiddenColumnTest {
  items = [1, 2, 3];
}

@Component({
  template: `
    <clr-datagrid>
        <clr-dg-column>First</clr-dg-column>
        <clr-dg-column>Second</clr-dg-column>
    
        <clr-dg-row *ngFor="let item of items;">
            <clr-dg-cell>{{item}}</clr-dg-cell>
            <clr-dg-cell>{{item * item}}</clr-dg-cell>
        </clr-dg-row>
    </clr-datagrid>`,
})
class ProjectionTest {
  constructor(renderer: Renderer2) {}

  items = [1, 2, 3];
}

const PROVIDERS = [
  { provide: DisplayModeService, useClass: MockDisplayModeService },
  Selection,
  Sort,
  FiltersProvider,
  Page,
  Items,
  DatagridRenderOrganizer,
  RowActionService,
  ExpandableRowsCount,
  HideableColumnService,
  StateDebouncer,
  StateProvider,
  ColumnToggleButtonsService,
  TableSizeService,
];

export default function(): void {
  describe('ClrDatagrid component', function() {
    describe('Typescript API', function() {
      let context: TestContext<ClrDatagrid<number>, FullTest>;

      beforeEach(function() {
        context = this.create(ClrDatagrid, FullTest, [HideableColumnService]);
      });

      it('allows to manually force a state change of displayed items when data mutates', function() {
        const items = context.getClarityProvider(Items);
        let refreshed = false;
        items.change.subscribe(() => (refreshed = true));
        expect(refreshed).toBe(false);
        context.clarityDirective.dataChanged();
        expect(refreshed).toBe(true);
      });

      it('allows to manually resize the datagrid', function() {
        const organizer: DatagridRenderOrganizer = context.getClarityProvider(DatagridRenderOrganizer);
        let resizeSteps = 0;
        organizer.renderStep.subscribe(() => {
          resizeSteps++;
        });
        expect(resizeSteps).toBe(0);
        context.clarityDirective.resize();
        expect(resizeSteps).toBe(7);
      });
    });

    describe('Template API', function() {
      let context: TestContext<ClrDatagrid<number>, FullTest>;

      beforeEach(function() {
        context = this.create(ClrDatagrid, FullTest, [HideableColumnService]);
      });

      it('receives an input for the loading state', function() {
        expect(context.clarityDirective.loading).toBe(false);
        context.testComponent.loading = true;
        context.detectChanges();
        expect(context.clarityDirective.loading).toBe(true);
      });

      it('offers two-way binding on the currently selected items', function() {
        const selection = context.getClarityProvider(Selection);
        context.testComponent.selected = [2];
        context.detectChanges();
        expect(selection.current).toEqual([2]);
        selection.setSelected(1, true);
        context.detectChanges();
        expect(context.testComponent.selected).toEqual([2, 1]);
      });

      it('allows to set pre-selected items when initializing the full list of items', function() {
        const selection = context.getClarityProvider(Selection);
        context.testComponent.items = [4, 5, 6];
        context.testComponent.selected = [5];
        context.detectChanges();
        expect(selection.current).toEqual([5]);
      });

      describe('clrDgStateChange output', function() {
        it('is the same as clrDgRefresh output', function() {
          expect(context.testComponent.latestRefreshState).toBe(context.testComponent.latestState);
        });

        it('emits once when the datagrid is ready', function() {
          expect(context.testComponent.nbRefreshed).toBe(1);
        });

        it('emits once when the sort order changes', function() {
          context.testComponent.nbRefreshed = 0;
          const sort = context.getClarityProvider(Sort);
          sort.toggle(new TestComparator());
          context.detectChanges();
          expect(context.testComponent.nbRefreshed).toBe(1);
        });

        it('emits once when the filters change', function() {
          context.testComponent.nbRefreshed = 0;
          const filters = context.getClarityProvider(FiltersProvider);
          const filter = new TestFilter();
          filters.add(filter);
          context.detectChanges();
          expect(context.testComponent.nbRefreshed).toBe(1);
        });

        it('emits once when the filters change when currentPage > 1', function() {
          // filter change should set the page to 1, so we expect two events that trigger emits
          // datagrid should consolidate and still emit once
          context.testComponent.items = [1, 2, 3, 4, 5, 6];
          context.detectChanges();
          const page: Page = context.getClarityProvider(Page);
          page.size = 2;
          page.current = 2;
          context.testComponent.nbRefreshed = 0;
          const filters = context.getClarityProvider(FiltersProvider);
          const filter = new TestFilter();
          filters.add(filter);
          context.detectChanges();
          expect(context.testComponent.nbRefreshed).toBe(1);
        });

        it('emits once when the page changes', function() {
          context.testComponent.nbRefreshed = 0;
          const page: Page = context.getClarityProvider(Page);
          page.current = 2;
          context.detectChanges();
          expect(context.testComponent.nbRefreshed).toBe(1);
        });

        it('emits once when the page size changes', function() {
          context.testComponent.nbRefreshed = 0;
          const page: Page = context.getClarityProvider(Page);
          page.size = 2;
          context.detectChanges();
          expect(context.testComponent.nbRefreshed).toBe(1);
          page.size = 5;
          context.detectChanges();
          expect(context.testComponent.nbRefreshed).toBe(2);
          page.resetPageSize();
          expect(context.testComponent.nbRefreshed).toBe(3);
        });

        it('emits the complete state of the datagrid', function() {
          context.testComponent.items = [1, 2, 3, 4, 5, 6];
          context.detectChanges();
          const comparator = new TestComparator();
          const sort = context.getClarityProvider(Sort);
          sort.toggle(comparator);
          const filters = context.getClarityProvider(FiltersProvider);
          const filter = new TestFilter();
          filters.add(filter);
          const page: Page = context.getClarityProvider(Page);
          page.size = 2;
          page.current = 2;
          context.detectChanges();
          expect(context.testComponent.latestState).toEqual({
            page: {
              from: 2,
              to: 3,
              size: 2,
            },
            sort: {
              by: comparator,
              reverse: false,
            },
            filters: [filter],
          });
        });

        it('emits early enough to avoid chocolate errors on the loading input', function() {
          context.testComponent.fakeLoad = true;
          const page: Page = context.getClarityProvider(Page);
          page.current = 2;
          expect(() => context.detectChanges()).not.toThrow();
        });

        // Actually not fixed yet, my bad
        xit("doesn't emit when the datagrid is destroyed", function() {
          context.testComponent.filter = true;
          context.detectChanges();
          context.testComponent.nbRefreshed = 0;
          context.testComponent.destroy = true;
          context.detectChanges();
          expect(context.testComponent.nbRefreshed).toBe(0);
        });
      });

      describe('clrDgState input', function() {
        let stateProvider: StateProvider<number>;

        beforeEach(() => {
          stateProvider = context.getClarityProvider(StateProvider);
        });

        it('sets the paginator', function() {
          context.testComponent.items = [1, 2, 3, 4, 5, 6];
          const newPage = {
            from: 2,
            to: 3,
            size: 2,
          };
          expect(context.testComponent.nbRefreshed).toEqual(1);
          context.testComponent.state = {
            page: newPage,
          };
          context.detectChanges();
          expect(context.testComponent.nbRefreshed).toEqual(2);
          expect(stateProvider.state.page).toEqual(newPage, 'state in provider not updated');
        });

        it('sets the custom sorting comparator', function() {
          const sortState = {
            by: new TestComparator(),
            reverse: false,
          };
          expect(context.testComponent.nbRefreshed).toEqual(1);
          context.testComponent.state = {
            sort: sortState,
          };
          context.detectChanges();
          expect(context.testComponent.nbRefreshed).toEqual(2);
          expect(stateProvider.state.sort).toEqual(sortState);
        });

        it('sets the default property comparator', function() {
          const sortState = {
            by: 'property',
            reverse: false,
          };
          expect(context.testComponent.nbRefreshed).toEqual(1);
          context.testComponent.state = {
            sort: sortState,
          };
          context.detectChanges();
          expect(context.testComponent.nbRefreshed).toEqual(2);
          expect(stateProvider.state.sort).toEqual(sortState);
        });

        it('adds and removes the correct data for BuiltinStringFilters', function() {
          const filters = context.getClarityProvider(FiltersProvider);
          const stringFilter1 = new DatagridStringFilterImpl(new DatagridPropertyStringFilter('test'));
          stringFilter1.value = '1234';
          const stringFilter2 = new DatagridStringFilterImpl(new DatagridPropertyStringFilter('otherProperty'));
          stringFilter2.value = 'otherValue';

          filters.add(stringFilter1);
          filters.add(stringFilter2);
          context.detectChanges();

          expect(filters.getActiveFilters()).toBeArrayOfSize(2);
          expect(
            filters.getActiveFilters().every(filter => filter.filterState.type === 'BuiltinStringFilter')
          ).toBeTrue('Not every active filter is BuiltinStringFilter');
          expect((<DatagridStringFilterImpl>filters.getActiveFilters()[0]).filterState.property).toContain('test');
          expect((<DatagridStringFilterImpl>filters.getActiveFilters()[0]).filterState.value).toContain('1234');
          expect((<DatagridStringFilterImpl>filters.getActiveFilters()[1]).filterState.property).toContain(
            'otherProperty'
          );
          expect((<DatagridStringFilterImpl>filters.getActiveFilters()[1]).filterState.value).toContain('otherValue');
          expect(context.testComponent.latestState.filters).toEqual([
            { property: 'test', value: '1234' },
            { property: 'otherProperty', value: 'otherValue' },
          ]);

          filters.remove(stringFilter1);
          context.detectChanges();

          expect(filters.getActiveFilters()).toBeArrayOfSize(1);
          expect(
            filters.getActiveFilters().every(filter => filter.filterState.type === 'BuiltinStringFilter')
          ).toBeTrue('Not every active filter is BuiltinStringFilter');
          expect((<DatagridStringFilterImpl>filters.getActiveFilters()[0]).filterState.property).toContain(
            'otherProperty'
          );
          expect((<DatagridStringFilterImpl>filters.getActiveFilters()[0]).filterState.value).toContain('otherValue');
          expect(context.testComponent.latestState.filters).toEqual([
            { property: 'otherProperty', value: 'otherValue' },
          ]);
        });

        it('adds and removes the correct data for Color filters', function() {
          const filters = context.getClarityProvider(FiltersProvider);
          const colorFilter1 = new ColorFilter();
          colorFilter1.toggleColor('Blue');
          colorFilter1.toggleColor('Green');
          const colorFilter2 = new ColorFilter();
          colorFilter2.toggleColor('Red');
          colorFilter2.toggleColor('White');

          filters.add(colorFilter1);
          filters.add(colorFilter2);
          context.detectChanges();

          expect(filters.getActiveFilters()).toBeArrayOfSize(2);
          expect(filters.getActiveFilters().every(filter => filter.filterState.type === 'ColorFilter')).toBeTrue(
            'Not every active filter is ColorFilter'
          );
          expect((<ColorFilter>filters.getActiveFilters()[0]).listSelected()).toContain('Green');
          expect((<ColorFilter>filters.getActiveFilters()[0]).listSelected()).toContain('Blue');
          expect((<ColorFilter>filters.getActiveFilters()[0]).listSelected()).not.toContain('White');
          expect((<ColorFilter>filters.getActiveFilters()[0]).listSelected()).not.toContain('Brown');
          expect((<ColorFilter>filters.getActiveFilters()[1]).listSelected()).toContain('White');
          expect((<ColorFilter>filters.getActiveFilters()[1]).listSelected()).toContain('Red');
          expect((<ColorFilter>filters.getActiveFilters()[1]).listSelected()).not.toContain('Green');
          expect((<ColorFilter>filters.getActiveFilters()[1]).listSelected()).not.toContain('Yellow');
          expect(context.testComponent.latestState.filters).toEqual([colorFilter1, colorFilter2]);

          filters.remove(colorFilter1);
          context.detectChanges();

          expect(filters.getActiveFilters()).toBeArrayOfSize(1);
          expect(filters.getActiveFilters().every(filter => filter.filterState.type === 'ColorFilter')).toBeTrue(
            'Not every active filter is ColorFilter'
          );
          expect((<ColorFilter>filters.getActiveFilters()[0]).listSelected()).toContain('White');
          expect((<ColorFilter>filters.getActiveFilters()[0]).listSelected()).toContain('Red');
          expect((<ColorFilter>filters.getActiveFilters()[0]).listSelected()).not.toContain('Green');
          expect((<ColorFilter>filters.getActiveFilters()[0]).listSelected()).not.toContain('Yellow');
          expect(context.testComponent.latestState.filters).toEqual([colorFilter2]);
        });

        it('adds and removes the correct data for List filters', function() {
          const filters = context.getClarityProvider(FiltersProvider);
          const listFilter1 = new ListFilter();
          listFilter1.values = ['FEMALE', 'MALE'];
          listFilter1.selectedValue = 'MALE';
          const listFilter2 = new ListFilter();
          listFilter2.values = ['YES', 'NO', 'MAYBE'];
          listFilter2.selectedValue = 'MAYBE';

          filters.add(listFilter1);
          filters.add(listFilter2);
          context.detectChanges();

          expect(filters.getActiveFilters()).toBeArrayOfSize(2);
          expect(filters.getActiveFilters().every(filter => filter.filterState.type === 'ListFilter')).toBeTrue(
            'Not every active filter is ListFilter'
          );
          expect((<ListFilter>filters.getActiveFilters()[0]).selectedValue).toEqual('MALE');
          expect((<ListFilter>filters.getActiveFilters()[1]).selectedValue).toEqual('MAYBE');
          expect(context.testComponent.latestState.filters).toEqual([listFilter1, listFilter2]);

          filters.remove(listFilter2);
          context.detectChanges();

          expect(filters.getActiveFilters()).toBeArrayOfSize(1);
          expect(filters.getActiveFilters().every(filter => filter.filterState.type === 'ListFilter')).toBeTrue(
            'Not every active filter is ListFilter'
          );
          expect((<ListFilter>filters.getActiveFilters()[0]).selectedValue).toEqual('MALE');
          expect(context.testComponent.latestState.filters).toEqual([listFilter1]);
        });

        it('adds and removes the correct data for Date interval filters', function() {
          const filters = context.getClarityProvider(FiltersProvider);
          const dateIntervalFilter1 = new DateIntervalFilter();
          const today = new Date();
          dateIntervalFilter1.from = today;
          let to1 = new Date();
          to1.setDate(to1.getDate() + 1);
          dateIntervalFilter1.to = to1;
          const dateIntervalFilter2 = new DateIntervalFilter();
          dateIntervalFilter2.from = today;
          let to2 = new Date();
          to2.setDate(to2.getDate() + 3);
          dateIntervalFilter2.to = to2;

          filters.add(dateIntervalFilter1);
          filters.add(dateIntervalFilter2);
          context.detectChanges();

          expect(filters.getActiveFilters()).toBeArrayOfSize(2);
          expect(filters.getActiveFilters().every(filter => filter.filterState.type === 'DateIntervalFilter')).toBeTrue(
            'Not every active filter is DateIntervalFilter'
          );
          expect((<NumberIntervalFilter>filters.getActiveFilters()[0]).from.toString()).toEqual(today.toString());
          expect((<NumberIntervalFilter>filters.getActiveFilters()[0]).to.toString()).toEqual(to1.toString());
          expect((<NumberIntervalFilter>filters.getActiveFilters()[1]).from.toString()).toEqual(today.toString());
          expect((<NumberIntervalFilter>filters.getActiveFilters()[1]).to.toString()).toEqual(to2.toString());
          expect(context.testComponent.latestState.filters).toEqual([dateIntervalFilter1, dateIntervalFilter2]);

          filters.remove(dateIntervalFilter2);
          context.detectChanges();

          expect(filters.getActiveFilters()).toBeArrayOfSize(1);
          expect(filters.getActiveFilters().every(filter => filter.filterState.type === 'DateIntervalFilter')).toBeTrue(
            'Not every active filter is DateIntervalFilter'
          );
          expect((<NumberIntervalFilter>filters.getActiveFilters()[0]).from.toString()).toEqual(today.toString());
          expect((<NumberIntervalFilter>filters.getActiveFilters()[0]).to.toString()).toEqual(to1.toString());
          expect(context.testComponent.latestState.filters).toEqual([dateIntervalFilter1]);
        });

        it('adds and removes the correct data for Number interval filters', function() {
          const filters = context.getClarityProvider(FiltersProvider);
          const numberIntervalFilter1 = new NumberIntervalFilter();
          numberIntervalFilter1.from = 2;
          numberIntervalFilter1.to = 7;
          const numberIntervalFilter2 = new NumberIntervalFilter();
          numberIntervalFilter2.from = 13;
          numberIntervalFilter2.to = 78;

          filters.add(numberIntervalFilter1);
          filters.add(numberIntervalFilter2);
          context.detectChanges();

          expect(filters.getActiveFilters()).toBeArrayOfSize(2);
          expect(
            filters.getActiveFilters().every(filter => filter.filterState.type === 'NumberIntervalFilter')
          ).toBeTrue('Not every active filter is NumberIntervalFilter');
          expect((<NumberIntervalFilter>filters.getActiveFilters()[0]).from).toEqual(2);
          expect((<NumberIntervalFilter>filters.getActiveFilters()[0]).to).toEqual(7);
          expect((<NumberIntervalFilter>filters.getActiveFilters()[1]).from).toEqual(13);
          expect((<NumberIntervalFilter>filters.getActiveFilters()[1]).to).toEqual(78);
          expect(context.testComponent.latestState.filters).toEqual([numberIntervalFilter1, numberIntervalFilter2]);

          filters.remove(numberIntervalFilter1);
          context.detectChanges();

          expect(filters.getActiveFilters()).toBeArrayOfSize(1);
          expect(
            filters.getActiveFilters().every(filter => filter.filterState.type === 'NumberIntervalFilter')
          ).toBeTrue('Not every active filter is NumberIntervalFilter');
          expect((<NumberIntervalFilter>filters.getActiveFilters()[0]).from).toEqual(13);
          expect((<NumberIntervalFilter>filters.getActiveFilters()[0]).to).toEqual(78);
          expect(context.testComponent.latestState.filters).toEqual([numberIntervalFilter2]);
        });

        it('adds and removes the correct data for all filter types', function() {
          const filters = context.getClarityProvider(FiltersProvider);
          const listFilter = new ListFilter();
          listFilter.values = ['FEMALE', 'MALE'];
          listFilter.selectedValue = 'MALE';
          const colorFilter = new ColorFilter();
          colorFilter.toggleColor('Blue');
          colorFilter.toggleColor('Green');
          const dateIntervalFilter = new DateIntervalFilter();
          const from = new Date();
          dateIntervalFilter.from = from;
          let to = new Date();
          to.setDate(to.getDate() + 1);
          dateIntervalFilter.to = to;
          const numberIntervalFilter = new NumberIntervalFilter();
          numberIntervalFilter.from = 13;
          numberIntervalFilter.to = 78;
          const builtinStringFilter = new DatagridStringFilterImpl(new DatagridPropertyStringFilter('test'));
          builtinStringFilter.value = '1234';

          filters.add(listFilter);
          filters.add(colorFilter);
          filters.add(dateIntervalFilter);
          filters.add(numberIntervalFilter);
          filters.add(builtinStringFilter);
          context.detectChanges();

          expect(filters.getActiveFilters()).toBeArrayOfSize(5);
          expect(context.testComponent.latestState.filters[0].filterState.type).toEqual('ListFilter');
          expect((<ListFilter>context.testComponent.latestState.filters[0]).selectedValue).toEqual('MALE');
          expect(context.testComponent.latestState.filters[1].filterState.type).toEqual('ColorFilter');
          const selectedColors = (<ColorFilter>context.testComponent.latestState.filters[1]).listSelected();
          expect(selectedColors).toContain('Blue');
          expect(selectedColors).toContain('Green');
          expect(selectedColors).not.toContain('Red');
          expect(context.testComponent.latestState.filters[2].filterState.type).toEqual('DateIntervalFilter');
          expect((<DateIntervalFilter>context.testComponent.latestState.filters[2]).from).toEqual(from);
          expect((<DateIntervalFilter>context.testComponent.latestState.filters[2]).to).toEqual(to);
          expect(context.testComponent.latestState.filters[3].filterState.type).toEqual('NumberIntervalFilter');
          expect((<NumberIntervalFilter>context.testComponent.latestState.filters[3]).from).toEqual(13);
          expect((<NumberIntervalFilter>context.testComponent.latestState.filters[3]).to).toEqual(78);
          console.log(context.testComponent.latestState.filters[4]);
          expect(context.testComponent.latestState.filters[4].property).toEqual('test');
          expect(context.testComponent.latestState.filters[4].value).toEqual('1234');
          expect(context.testComponent.latestState.filters).toEqual([
            listFilter,
            colorFilter,
            dateIntervalFilter,
            numberIntervalFilter,
            { property: 'test', value: '1234' },
          ]);

          filters.remove(colorFilter);
          filters.remove(numberIntervalFilter);
          context.detectChanges();

          expect(filters.getActiveFilters()).toBeArrayOfSize(3);
          expect(context.testComponent.latestState.filters[0].filterState.type).toEqual('ListFilter');
          expect((<ListFilter>context.testComponent.latestState.filters[0]).selectedValue).toEqual('MALE');
          expect(context.testComponent.latestState.filters[1].filterState.type).toEqual('DateIntervalFilter');
          expect((<DateIntervalFilter>context.testComponent.latestState.filters[1]).from).toEqual(from);
          expect((<DateIntervalFilter>context.testComponent.latestState.filters[1]).to).toEqual(to);
          expect(context.testComponent.latestState.filters[2].property).toEqual('test');
          expect(context.testComponent.latestState.filters[2].value).toEqual('1234');
          expect(context.testComponent.latestState.filters).toEqual([
            listFilter,
            dateIntervalFilter,
            { property: 'test', value: '1234' },
          ]);

          filters.remove(listFilter);
          filters.remove(dateIntervalFilter);
          filters.remove(builtinStringFilter);
          context.detectChanges();

          expect(filters.getActiveFilters()).toBeEmptyArray();
          expect(context.testComponent.latestState.filters).toBeUndefined();
        });
      });
    });

    describe('View basics', function() {
      let context: TestContext<ClrDatagrid<number>, FullTest>;

      beforeEach(function() {
        context = this.create(ClrDatagrid, FullTest, [HideableColumnService]);
      });

      it('projects columns in the header', function() {
        const header = context.clarityElement.querySelector('.datagrid-header');
        expect(header.textContent).toMatch(/First\s*Second/);
      });

      it('projects the footer', function() {
        expect(context.clarityElement.querySelector('.datagrid-footer')).not.toBeNull();
      });

      it('adds a11y roles to datagrid', function() {
        const tableWrapper = context.clarityElement.querySelector('.datagrid-table');
        expect(tableWrapper.attributes.role.value).toEqual('grid');

        const header = context.clarityElement.querySelector('.datagrid-header');
        expect(header.attributes.role.value).toEqual('rowgroup');

        const row = context.clarityElement.querySelector('.datagrid-row');
        expect(row.attributes.role.value).toEqual('row');

        const columns = context.clarityElement.querySelectorAll('.datagrid-column');
        columns.forEach(column => expect(column.attributes.role.value).toEqual('columnheader'));
      });
    });

    describe('Iterators', function() {
      it('projects rows when using ngFor', function() {
        this.context = this.create(ClrDatagrid, NgForTest, [HideableColumnService]);
        const body = this.context.clarityElement.querySelector('.datagrid-table');
        expect(body.textContent).toMatch(/1\s*1\s*2\s*4\s*3\s*9/);
      });

      it('uses the rows template when using clrDgItems', function() {
        this.context = this.create(ClrDatagrid, FullTest, [HideableColumnService]);
        const body = this.context.clarityElement.querySelector('.datagrid-table');
        expect(body.textContent).toMatch(/1\s*1\s*2\s*4\s*3\s*9/);
      });
    });

    describe('Actionable rows', function() {
      let context: TestContext<ClrDatagrid<number>, ActionableRowTest>;
      let rowActionService: RowActionService;
      let headActionOverflowCell: HTMLElement;
      let actionOverflowCell: HTMLElement[];
      let actionOverflow: HTMLElement[];

      it('it has cells for action overflows if there is at least one of them.', function() {
        context = this.create(ClrDatagrid, ActionableRowTest, [HideableColumnService]);
        rowActionService = context.getClarityProvider(RowActionService);
        expect(rowActionService.hasActionableRow).toBe(true);
        const datagridHead = context.clarityElement.querySelector('.datagrid-header');
        headActionOverflowCell = datagridHead.querySelector('.datagrid-column.datagrid-row-actions');
        actionOverflowCell = context.clarityElement.querySelectorAll('.datagrid-row-actions');
        actionOverflow = context.clarityElement.querySelectorAll('clr-dg-action-overflow');
        expect(headActionOverflowCell).not.toBeNull();
        expect(actionOverflowCell.length).toEqual(4);
        expect(actionOverflow.length).toEqual(3);
      });

      it('it has no cells for action overflows if there is none of them.', function() {
        context = this.create(ClrDatagrid, ActionableRowTest, [HideableColumnService]);
        rowActionService = context.getClarityProvider(RowActionService);
        context.testComponent.showIfGreaterThan = 10;
        context.detectChanges();
        actionOverflow = context.clarityElement.querySelectorAll('clr-dg-action-overflow');
        expect(actionOverflow.length).toEqual(0);
        expect(rowActionService.hasActionableRow).toBe(false);
        const datagridHead = context.clarityElement.querySelector('.datagrid-header');
        headActionOverflowCell = datagridHead.querySelector('.datagrid-column.datagrid-row-actions');
        actionOverflowCell = context.clarityElement.querySelectorAll('clr-dg-cell.datagrid-single-select');
        expect(headActionOverflowCell).toBeNull();
        expect(actionOverflowCell.length).toEqual(0);
      });
    });

    describe('Expandable rows', function() {
      it('detects if there is at least one expandable row', function() {
        const context = this.create(ClrDatagrid, ExpandableRowTest, [HideableColumnService]);
        const globalExpandableRows: ExpandableRowsCount = context.getClarityProvider(ExpandableRowsCount);
        expect(globalExpandableRows.hasExpandableRow).toBe(true);
        expect(context.clarityElement.querySelector('.datagrid-column.datagrid-expandable-caret')).not.toBeNull();
        context.testComponent.expandable = false;
        context.detectChanges();
        expect(globalExpandableRows.hasExpandableRow).toBe(false);
        expect(context.clarityElement.querySelector('.datagrid-column.datagrid-expandable-caret')).toBeNull();
      });
    });

    describe('Single selection', function() {
      let context: TestContext<ClrDatagrid<number>, SingleSelectionTest>;
      let selection: Selection<number>;

      beforeEach(function() {
        context = this.create(ClrDatagrid, SingleSelectionTest, [Selection]);
        selection = <Selection<number>>context.getClarityProvider(Selection);
      });

      describe('TypeScript API', function() {
        // None for now, would duplicate tests of Selection provider
      });

      describe('Template API', function() {
        it('sets the currentSingle binding', function() {
          expect(selection.currentSingle).toBeUndefined();
          context.testComponent.selected = 1;
          context.detectChanges();
          expect(selection.currentSingle).toEqual(1);
          context.testComponent.selected = null;
          context.detectChanges();
          expect(selection.currentSingle).toBeNull();
        });

        it('does not emit a change event for on initialization, before selection', function() {
          let singleSelectedchangeCount: number = 0;
          const sub = context.clarityDirective.singleSelectedChanged.subscribe(s => singleSelectedchangeCount++);

          expect(selection.currentSingle).toBeUndefined();
          expect(singleSelectedchangeCount).toEqual(0);

          sub.unsubscribe();
        });

        it('it emits a change event when changing the selection', function() {
          let singleSelectedchangeCount: number = 0;
          const sub = context.clarityDirective.singleSelectedChanged.subscribe(s => singleSelectedchangeCount++);

          context.testComponent.selected = 1;
          context.detectChanges();
          expect(selection.currentSingle).toEqual(1);
          expect(singleSelectedchangeCount).toEqual(1);

          sub.unsubscribe();
        });

        it('it does not emit a change event when setting selection to undefined/null if already undefined/null', function() {
          let singleSelectedchangeCount: number = 0;
          const sub = context.clarityDirective.singleSelectedChanged.subscribe(s => singleSelectedchangeCount++);

          expect(selection.currentSingle).toBeUndefined();
          expect(singleSelectedchangeCount).toEqual(0);

          context.testComponent.selected = null;
          context.detectChanges();
          expect(selection.currentSingle).toBeUndefined();
          expect(singleSelectedchangeCount).toEqual(0);

          sub.unsubscribe();
        });

        it('it does not emit a change event when selecting the same value', function() {
          let singleSelectedchangeCount: number = 0;
          const sub = context.clarityDirective.singleSelectedChanged.subscribe(s => singleSelectedchangeCount++);

          context.testComponent.selected = 1;
          context.detectChanges();
          expect(selection.currentSingle).toEqual(1);
          expect(singleSelectedchangeCount).toEqual(1);

          // re-assigning to the same value should not increase the singleSelectedchangeCount
          context.testComponent.selected = 1;
          context.detectChanges();
          expect(selection.currentSingle).toEqual(1);
          expect(singleSelectedchangeCount).toEqual(1);

          sub.unsubscribe();
        });

        it('offers two way binding on the currentSingle value', function() {
          expect(selection.currentSingle).toBeUndefined();
          context.testComponent.selected = 1;
          context.detectChanges();
          expect(selection.currentSingle).toEqual(1);
          selection.currentSingle = 2;
          context.detectChanges();
          expect(context.testComponent.selected).toEqual(2);
        });
      });

      describe('View', function() {
        it('sets the proper selected class', function() {
          const row = context.clarityElement.querySelectorAll('.datagrid-row')[1];
          expect(row.classList.contains('datagrid-selected')).toBeFalsy();
          selection.currentSingle = 1;
          context.detectChanges();
          expect(row.classList.contains('datagrid-selected')).toBeTruthy();
        });
      });
    });

    describe('Multi selection', function() {
      let context: TestContext<ClrDatagrid<number>, OnPushTest>;
      let selection: Selection<number>;

      beforeEach(function() {
        context = this.create(ClrDatagrid, OnPushTest, [Selection], [MultiSelectionTest]);
        selection = <Selection<number>>context.getClarityProvider(Selection);
      });

      describe('Template API', function() {
        it('sets the selected binding with OnPush', function() {
          selection.selectionType = SelectionType.Multi;
          expect(selection.current).toEqual(context.testComponent.selected);
          context.testComponent.selected = [1];
          context.detectChanges();
          expect(selection.current).toEqual(context.testComponent.selected);
          context.testComponent.selected = [];
          context.detectChanges();
          expect(selection.current).toEqual(context.testComponent.selected);
        });
      });
    });

    describe('Chocolate', function() {
      describe('clrDgItems', function() {
        it("doesn't taunt with chocolate on actionable rows", function() {
          const context = this.create(ClrDatagrid, ChocolateClrDgItemsTest);
          context.testComponent.action = true;
          expect(() => context.detectChanges()).not.toThrow();
        });

        it("doesn't taunt with chocolate on expandable rows", function() {
          const context = this.create(ClrDatagrid, ChocolateClrDgItemsTest);
          context.testComponent.expandable = true;
          expect(() => context.detectChanges()).not.toThrow();
        });
      });

      describe('ngFor', function() {
        it("doesn't taunt with chocolate on actionable rows", function() {
          const context = this.create(ClrDatagrid, ChocolateNgForTest);
          context.testComponent.action = true;
          expect(() => context.detectChanges()).not.toThrow();
        });

        it("doesn't taunt with chocolate on expandable rows", function() {
          const context = this.create(ClrDatagrid, ChocolateNgForTest);
          context.testComponent.expandable = true;
          expect(() => context.detectChanges()).not.toThrow();
        });
      });

      describe('column hidden by default', function() {
        it("doesn't taunt with chocolate on columns hidden by default", function() {
          const context = this.create(ClrDatagrid, HiddenColumnTest);
          expect(() => context.detectChanges()).not.toThrow();
        });
      });
    });

    describe('Content Projection', function() {
      let context: TestContext<ClrDatagrid, OnPushTest>;
      let displayModeService: MockDisplayModeService;

      beforeEach(function() {
        context = this.createWithOverride(ClrDatagrid, ProjectionTest, [], [], PROVIDERS);
        displayModeService = <MockDisplayModeService>context.getClarityProvider(DisplayModeService);
      });

      it('moves columns into the display container', function() {
        displayModeService.updateView(DatagridDisplayMode.DISPLAY);
        const displayHeader = context.clarityElement.querySelector('.datagrid-header');
        const displayColumns = displayHeader.querySelectorAll('.datagrid-column');
        expect(displayColumns.length).toBe(2);
      });

      it('moves rows into the display container', function() {
        displayModeService.updateView(DatagridDisplayMode.DISPLAY);
        const displayTable = context.clarityElement.querySelector('.datagrid-table');
        const displayRows = displayTable.querySelectorAll('.datagrid-row');
        expect(displayRows.length).toBe(4);
      });

      it('moves columns into the calculation container', function() {
        displayModeService.updateView(DatagridDisplayMode.CALCULATE);
        const calculationHeader = context.clarityElement.querySelector('.datagrid-calculation-header');
        const calculationColumns = calculationHeader.querySelectorAll('.datagrid-column');
        expect(calculationColumns.length).toBe(2);
      });

      it('moves the rows into the calculation container', function() {
        displayModeService.updateView(DatagridDisplayMode.CALCULATE);
        const calculationTable = context.clarityElement.querySelector('.datagrid-calculation-table');
        const calculationRows = calculationTable.querySelectorAll('.datagrid-row');
        expect(calculationRows.length).toBe(3);
      });
    });
  });
}
