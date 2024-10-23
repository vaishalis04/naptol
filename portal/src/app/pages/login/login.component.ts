import { JsonPipe } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule, NgForm, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ApiService } from '../../services/api.service';
// import { BluetoothPrinter } from '@kduma-autoid/capacitor-bluetooth-printer';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    RouterLink,
    JsonPipe
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  public login = {
    email: '',
    password: ''
  };

  constructor(
    private apiService: ApiService,
    private authService: AuthService,
  ) { }

  submitLogin(loginForm: NgForm) {
    if (loginForm.valid) {
      this.apiService.post('auth/login', this.login).subscribe(
        {
          next: (res: any) => {
            console.log('Login successful');
            this.authService.loginUser(res.accessToken, res.refreshToken, res.user);
          },
          error: (err: any) => {
            console.log('Login failed');
          }
        }
      );
    }
  }

  // Test: button for sample print on thermal printer
  print() {
    // Thermal printer will be connected to the device via bluetooth and this application will be build with capacitor for android
    const printData = 'Hello World';
    // BluetoothPrinter.print({data: printData});
    console.log('Printing...');
  }

}
