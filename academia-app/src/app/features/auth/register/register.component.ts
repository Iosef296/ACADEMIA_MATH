import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { register } from '../../../store/auth/auth.actions';
import { selectAuthLoading, selectAuthError } from '../../../store/auth/auth.selectors';

function passwordsMatch(group: AbstractControl): ValidationErrors | null {
  const password = group.get('password')?.value;
  const confirm = group.get('confirmPassword')?.value;
  return password === confirm ? null : { passwordsMismatch: true };
}

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  standalone: false,
})
export class RegisterComponent {
  form: FormGroup;
  loading$: Observable<boolean>;
  error$: Observable<string | null>;
  showPassword = false;
  showConfirm = false;

  constructor(private fb: FormBuilder, private store: Store) {
    this.form = this.fb.group(
      {
        name: ['', [Validators.required, Validators.minLength(2)]],
        email: ['', [Validators.required, Validators.email]],
        password: ['', [Validators.required, Validators.minLength(6)]],
        confirmPassword: ['', Validators.required],
      },
      { validators: passwordsMatch }
    );
    this.loading$ = this.store.select(selectAuthLoading);
    this.error$ = this.store.select(selectAuthError);
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { name, email, password } = this.form.value;
    this.store.dispatch(register({ name, email, password, role: 'student' }));
  }

  isInvalid(field: string): boolean {
    const control = this.form.get(field);
    return !!(control?.invalid && control?.touched);
  }

  get confirmMismatch(): boolean {
    return !!(
      this.form.hasError('passwordsMismatch') &&
      this.form.get('confirmPassword')?.touched
    );
  }
}
