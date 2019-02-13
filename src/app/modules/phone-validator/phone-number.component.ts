import { Component, ElementRef, forwardRef, HostListener, Input, OnInit } from '@angular/core';
import { ControlValueAccessor, FormControl, NG_VALIDATORS, NG_VALUE_ACCESSOR, ValidationErrors, Validator } from '@angular/forms';
import glibphone from 'google-libphonenumber';
import { Country } from './country.model';
import { CountryService } from './country.service';

const PLUS = '+';

const COUNTER_CONTROL_ACCESSOR = {
  provide: NG_VALUE_ACCESSOR,
  // tslint:disable:no-use-before-declare
  useExisting: forwardRef(() => PhoneNumberComponent),
  multi: true
};


const VALIDATOR = {
  provide: NG_VALIDATORS,
  // tslint:disable:no-use-before-declare
  useExisting: forwardRef(() => PhoneNumberComponent),
  multi: true
};

@Component({
  selector: 'app-international-phone-number',
  templateUrl: './phone-number.component.html',
  styleUrls: [
    './phone-number.component.scss',
    './assets/css/flags.min.css'
  ],
  providers: [COUNTER_CONTROL_ACCESSOR, VALIDATOR]
})
export class PhoneNumberComponent implements OnInit, ControlValueAccessor, Validator {

  // input
  @Input() placeholder = 'Enter phone number'; // default
  @Input() maxLength = 15; // default

  @Input() defaultCountry: string;
  @Input() required: boolean;
  @Input() allowDropdown = true;

  // ELEMENT REF
  phoneComponent: ElementRef;

  // CONTROL VALUE ACCESSOR FUNCTIONS
  onTouch: Function;
  onModelChange: Function;

  countries: Country[];
  selectedCountry: Country;
  countryFilter: string;
  showDropdown = false;
  phoneNumber = '';
  useDefault = true;

  value = '';

  /**
   * Util function to check if given text starts with plus sign
   * @param text
   */
  private static startsWithPlus(text: string): boolean {
    return text.startsWith(PLUS);
  }

  /**
   * Reduced the prefixes
   * @param foundPrefixes
   */
  private static reducePrefixes(foundPrefixes: Country[]) {
    return foundPrefixes.reduce(
      (first: Country, second: Country) =>
        first.dialCode.length > second.dialCode.length
          ? first
          : second
    );
  }

  constructor(private countryService: CountryService, phoneComponent: ElementRef) {
    this.phoneComponent = phoneComponent;
  }

  ngOnInit(): void {
    this.countries = this.countryService.getCountries();
    this.orderCountriesByName();
  }


  /**
   * Opens the country selection dropdown
   */
  displayDropDown() {
    if (this.allowDropdown) {
      this.showDropdown = !this.showDropdown;
      this.countryFilter = '';
    }
  }

  /**
   * Hides the country selection dropdown
   * @param event
   */

  @HostListener('document:click', ['$event'])
  hideDropdown(event: Event) {
    if (!this.phoneComponent.nativeElement.contains(event.target)) {
      this.showDropdown = false;
    }
  }

  /**
   * Sets the selected country code to given country
   * @param event
   * @param countryCode
   */
  updateSelectedCountry(event: Event, countryCode: string) {
    event.preventDefault();
    this.updatePhoneInput(countryCode);

    this.updateValue();
  }


  /**
   * Updates the phone number
   * @param event
   */
  updatePhoneNumber(event: Event) {
    if (PhoneNumberComponent.startsWithPlus(this.phoneNumber)) {
      this.findPrefix(this.phoneNumber.split(PLUS)[1]);
    } else {
      this.selectedCountry = null;
    }

    this.updateValue();
  }

  /**
   * shows the dropdown with keyboard event
   * @param event
   */
  @HostListener('document:keypress', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    if (this.showDropdown) {
      this.countryFilter = `${this.countryFilter}${event.key}`;
    }
  }

  /**
   *
   * @param prefix
   */
  private findPrefix(prefix: string) {
    const foundPrefixes: Country[] = this.countries.filter((country: Country) => prefix.startsWith(country.dialCode));
    // console.log('foundPrefixes ', foundPrefixes);
    if (foundPrefixes && foundPrefixes.length) {
      this.useDefault = false;
      this.selectedCountry = PhoneNumberComponent.reducePrefixes(foundPrefixes);
    } else {
      this.selectedCountry = null;
    }
  }

  /**
   * Sort countries by name
   */
  private orderCountriesByName() {
    this.countries = this.countries.sort(function (a, b) {
      return (a['name'] > b['name']) ? 1 : ((b['name'] > a['name']) ? -1 : 0);
    });
  }

  /**
   *
   * @param fn
   */
  registerOnTouched(fn: Function) {
    this.onTouch = fn;
  }

  /**
   *
   * @param fn
   */
  registerOnChange(fn: Function) {
    this.onModelChange = fn;
  }

  /**
   *
   * @param value
   */
  writeValue(value: string) {
    this.value = value || '';
    this.phoneNumber = this.value;

    if (PhoneNumberComponent.startsWithPlus(this.value)) {
      // console.log('started with plus: ', this.value);
      this.findPrefix(this.value.split(PLUS)[1]);
    }

    if (this.selectedCountry) {
      // console.log('selectedCountry: ', this.selectedCountry);
      this.updatePhoneInput(this.selectedCountry.countryCode);
    } else {
      if (this.defaultCountry && this.useDefault) {
        // console.log('defaultCountry: ', this.defaultCountry);
        this.updatePhoneInput(this.defaultCountry);
      }
    }

  }

  /**
   * Validation
   * @param c
   */
  validate(c: FormControl): ValidationErrors | null {
    const value = c.value;
    const selectedDialCode = this.getSelectedCountryDialCode();
    const validationError: ValidationErrors = {
      phoneEmptyError: {
        valid: false
      }
    };

    if (this.required && !value) {
      // if (value && selectedDialCode)
      //     value = value.replace(/\s/g, '').replace(selectedDialCode, '');

      // if (!value) return validationError;
      return validationError;
    }

    if (value) {
      // validating number using the google's lib phone
      const phoneUtil = glibphone.PhoneNumberUtil.getInstance();
      try {
        const phoneNumber = phoneUtil.parse(value);
        const isValidNumber = phoneUtil.isValidNumber(phoneNumber);
        return isValidNumber ? null : validationError;
      } catch (ex) {
        return validationError;
      }
    }
    return null;
  }


  /**
   * Updates the value and trigger changes
   */
  private updateValue() {
    this.value = this.phoneNumber.replace(/ /g, '');
    this.onModelChange(this.value);
    this.onTouch();
  }


  /**
   * Updates the input
   * @param countryCode
   */
  private updatePhoneInput(countryCode: string) {
    this.showDropdown = false;

    // fix(CK-535) https://intouch-dev.atlassian.net/browse/CK-535
    const newInputValue: string = PhoneNumberComponent.startsWithPlus(this.phoneNumber)
      ? `${this.phoneNumber.split(PLUS)[1].substr(this.selectedCountry.dialCode.length, this.phoneNumber.length)}`
      : this.phoneNumber.split(' ')[1] || this.phoneNumber;

    this.selectedCountry = this.countries.find((country: Country) => country.countryCode === countryCode);
    if (this.selectedCountry) {
      this.phoneNumber = `${PLUS}${this.selectedCountry.dialCode} ${newInputValue.replace(/ /g, '')}`;
      // console.log('updatePhoneInput selectedCountry: ', this.phoneNumber);
    } else {
      this.phoneNumber = `${newInputValue.replace(/ /g, '')}`;
      // console.log('updatePhoneInput: ', this.phoneNumber);
    }

  }

  /**
   * Returns the selected country's dialcode
   */
  private getSelectedCountryDialCode(): string {
    if (this.selectedCountry) {
      return PLUS + this.selectedCountry.dialCode;
    }
    return null;
  }


}
