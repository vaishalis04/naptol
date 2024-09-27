import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TransactionlistComponent } from './transactionlist.component';

describe('TransactionlistComponent', () => {
  let component: TransactionlistComponent;
  let fixture: ComponentFixture<TransactionlistComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TransactionlistComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(TransactionlistComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
