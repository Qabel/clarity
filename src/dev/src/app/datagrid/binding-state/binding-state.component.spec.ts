import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { BindingStateComponent } from './binding-state.component';

describe('BindingStateComponent', () => {
  let component: BindingStateComponent;
  let fixture: ComponentFixture<BindingStateComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ BindingStateComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BindingStateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
