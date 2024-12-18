import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StockViewComponent } from './stock-view.component';

describe('StockViewComponent', () => {
  let component: StockViewComponent;
  let fixture: ComponentFixture<StockViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StockViewComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StockViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
