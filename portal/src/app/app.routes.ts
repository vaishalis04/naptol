import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { PageNotFoundComponent } from './pages/page-not-found/page-not-found.component';
import { SignUpComponent } from './pages/sign-up/sign-up.component';
import { ForgotPasswordComponent } from './pages/forgot-password/forgot-password.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { PortalLayoutComponent } from './layouts/portal-layout/portal-layout.component';
import { ProfileComponent } from './pages/profile/profile.component';
import { SettingsComponent } from './pages/settings/settings.component';
import { authGuard } from './guards/auth.guard';
import { TaulParchiComponent } from './pages/taul-parchi/taul-parchi.component';
import { TruckLoadingParchiComponent } from './pages/truck-loading-parchi/truck-loading-parchi.component';
import { MastersComponent } from './pages/masters/masters.component';
import { FarmersComponent } from './pages/farmers/farmers.component';
import { VillagesComponent } from './pages/villages/villages.component';
import { HammalsComponent } from './pages/hammals/hammals.component';
import { CropComponent } from './pages/crop/crop.component';
import { PartiesComponent } from './pages/parties/parties.component';
import { DeliveryComponent } from './pages/delivery/delivery.component';
import { AccountsComponent } from './pages/accounts/accounts.component';
import { InventoryComponent } from './pages/inventory/inventory.component';
import { TransactionComponent } from './pages/transaction/transaction.component';
import { TransactionlistComponent } from './pages/transactionlist/transactionlist.component';
import { TruckComponent } from './pages/truck/truck.component';
import { ListComponent } from './pages/list/list.component';
import { MyListComponent } from './pages/my-list/my-list.component';
import { AdvancePaymentComponent } from './pages/advance-payment/advance-payment.component';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
  {
    path: 'login',
    component: LoginComponent,
    data: { title: 'Login' },
  },
  {
    // path: 'create-account',
    path: 'sign-up',
    component: SignUpComponent,
    data: { title: 'Sign Up' },
  },
  {
    path: 'forgot-password',
    component: ForgotPasswordComponent,
    data: { title: 'Forgot Password' },
  },
  {
    path: '',
    component: PortalLayoutComponent,
    canActivateChild: [authGuard],
    runGuardsAndResolvers: 'always',
    children: [
      {
        path: 'dashboard',
        component: DashboardComponent,
        data: { title: 'Dashboard' },
      },
      {
        path: 'taul-parchi',
        component: TaulParchiComponent,
        data: { title: 'Taul Parchi' },
      },
      {
        path: 'truck-loading-parchi',
        component: TruckLoadingParchiComponent,
        data: { title: 'Truck Loading Parchi' },
      },
      {
        path: 'masters',
        component: MastersComponent,
        data: { title: 'Masters' },
      },
      {
        path: 'farmers',
        component: FarmersComponent,
        data: { title: 'Farmers' },
      },
      {
        path: 'villages',
        component: VillagesComponent,
        data: { title: 'Villages' },
      },
      {
        path: 'hammals',
        component: HammalsComponent,
        data: { title: 'Hammals' },
      },
     
      {
        path: 'crops',
        component: CropComponent,
        data: { title: 'Crops' },
      },
      {
        path: 'parties',
        component: PartiesComponent,
        data: { title: 'Parties' },
      },
      {
        path: 'delivery',
        component: DeliveryComponent,
        data: { title: 'Delivery Locations' },
      },
      {
        path: 'profile',
        component: ProfileComponent,
        data: { title: 'Profile' },
      },
      {
        path: 'settings',
        component: SettingsComponent,
        data: { title: 'Settings' },
      },
      {
        path: 'accounts',
        component: AccountsComponent,
        data: { title: 'Accounts' },
      },
      {
        path: 'inventory',
        component: InventoryComponent,
        data: { title: 'Inventory' },
      },
      {
        path: 'transaction',
        component: TransactionComponent,
        data: { title: 'Transaction' },
      },
      {
        path: 'transactionlist',
        component: TransactionlistComponent,
        data: { title: 'Transactionlist' },
      },
      {
        path: 'truck',
        component: TruckComponent,
        data: { title: 'truck' },
      },
      {
        path: 'list',
        component: ListComponent,
        data: { title: 'list' },
      },
      {
        path: 'my-list',
        component: MyListComponent,
        data: { title: 'my-list' },
      },
      {
        path: 'advance-payment',
        component: AdvancePaymentComponent,
        data: { title: 'advance-payment' },
      },
    ],
    
  },
  {
    path: '**',
    component: PageNotFoundComponent,
    data: { title: 'Page Not Found' },
  },
];
