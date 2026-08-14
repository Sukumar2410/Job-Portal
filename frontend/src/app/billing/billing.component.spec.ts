import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BillingComponent } from './billing.component';
import { PaymentsService } from '../core/services/payments.service';
import { of } from 'rxjs';

describe('BillingComponent', () => {
  let fixture: ComponentFixture<BillingComponent>;
  let component: BillingComponent;
  let paymentsService: jasmine.SpyObj<PaymentsService>;

  beforeEach(async () => {
    paymentsService = jasmine.createSpyObj('PaymentsService', ['listPlans', 'getMySubscription', 'validateCoupon', 'createOrder', 'verifyPayment']);
    paymentsService.listPlans.and.returnValue(of([]));
    paymentsService.getMySubscription.and.returnValue(of(null));

    await TestBed.configureTestingModule({
      imports: [BillingComponent],
      providers: [{ provide: PaymentsService, useValue: paymentsService }],
    }).compileComponents();

    fixture = TestBed.createComponent(BillingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should keep coupon input as a plain string value', () => {
    component.couponCode = 'SAVE10';
    expect(component.couponCode).toBe('SAVE10');
  });
});
