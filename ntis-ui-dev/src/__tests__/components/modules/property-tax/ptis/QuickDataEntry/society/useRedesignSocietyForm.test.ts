import { describe, it, expect } from 'vitest';
import {
  validateSingleField,
  validateAllSocietyFields,
  validateEmailAddress,
} from '@/components/modules/property-tax/ptis/QuickDataEntry/society/redesign/useRedesignSocietyForm';
import type { ApartmentEditFormData } from '@/components/modules/property-tax/ptis/QuickDataEntry/society/redesign/types';

describe('useRedesignSocietyForm - Deep Validation Rules', () => {
  describe('Email Deep Validation', () => {
    it('should reject email with repeating letters in TLD (e.g. .commmmmm, .coooom)', () => {
      expect(validateEmailAddress('ramchandra@gmail.commmmmm')).not.toBeNull();
      expect(validateSingleField('societyEmail', 'ramchandra@gmail.commmmmm')).not.toBeNull();
      expect(validateSingleField('managerEmail', 'test@domain.coooom')).not.toBeNull();
      expect(validateSingleField('secretaryEmail', 'sec@domain.iiinnn')).not.toBeNull();
    });

    it('should reject invalid provider domain / extension (e.g. @gmail.con)', () => {
      expect(validateEmailAddress('user@gmail.con')).not.toBeNull();
      expect(validateEmailAddress('user@yahoo.con')).not.toBeNull();
    });

    it('should reject emails with consecutive dots, spaces, or invalid characters', () => {
      expect(validateEmailAddress('user..name@domain.com')).not.toBeNull();
      expect(validateEmailAddress('user name@domain.com')).not.toBeNull();
      expect(validateEmailAddress('user@domain..com')).not.toBeNull();
      expect(validateEmailAddress('.user@domain.com')).not.toBeNull();
      expect(validateEmailAddress('user@.domain.com')).not.toBeNull();
      expect(validateEmailAddress('user@domain.com.')).not.toBeNull();
    });

    it('should accept valid email addresses', () => {
      expect(validateEmailAddress('ramchandra@gmail.com')).toBeNull();
      expect(validateEmailAddress('society.manager@pune-society.co.in')).toBeNull();
      expect(validateEmailAddress('contact@housing.org')).toBeNull();
      expect(validateEmailAddress('info@gov.in')).toBeNull();
      expect(validateEmailAddress('')).toBeNull();
    });
  });

  describe('Regional Person Name Validation (Builder, Land Owner, Manager, Secretary)', () => {
    it('should reject names containing symbols like >>>>>>>>> or other special characters', () => {
      expect(validateSingleField('builderName', 'आदित्य कांबळे>>>>>>>>>>>')).not.toBeNull();
      expect(validateSingleField('landOwnerName', 'रामचंद्र शर्मा $$$$')).not.toBeNull();
      expect(validateSingleField('managerName', 'मैनेजर >>>')).not.toBeNull();
      expect(validateSingleField('secretaryName', 'सेक्रेटरी ####')).not.toBeNull();
    });

    it('should reject person names containing numbers', () => {
      expect(validateSingleField('builderName', 'आदित्य कांबळे १२३')).not.toBeNull();
      expect(validateSingleField('builderName', 'Aditya 123')).not.toBeNull();
    });

    it('should reject repeated special punctuation', () => {
      expect(validateSingleField('builderName', 'आदित्य ..... कांबळे')).not.toBeNull();
      expect(validateSingleField('builderName', 'आदित्य ----- कांबळे')).not.toBeNull();
    });

    it('should accept valid regional person names', () => {
      expect(validateSingleField('builderName', 'आदित्य कांबळे')).toBeNull();
      expect(validateSingleField('landOwnerName', 'रामचंद्र गोविंद शर्मा')).toBeNull();
      expect(validateSingleField('managerName', 'सुरेश पवार')).toBeNull();
      expect(validateSingleField('secretaryName', 'गणेश जोशी')).toBeNull();
    });
  });

  describe('English Person Name Validation', () => {
    it('should reject symbols like >>>>>>>>>> and numbers in English person names', () => {
      expect(validateSingleField('builderNameEnglish', 'aditya kamble>>>>>>>>>>>')).not.toBeNull();
      expect(validateSingleField('landOwnerNameEnglish', 'John Doe 123')).not.toBeNull();
      expect(validateSingleField('managerNameEnglish', 'Manager @@@')).not.toBeNull();
    });

    it('should accept valid English person names', () => {
      expect(validateSingleField('builderNameEnglish', 'Aditya Kamble')).toBeNull();
      expect(validateSingleField('landOwnerNameEnglish', 'Ramchandra Govind Sharma')).toBeNull();
      expect(validateSingleField('managerNameEnglish', 'Suresh Pawar')).toBeNull();
      expect(validateSingleField('secretaryNameEnglish', 'Ganesh Joshi')).toBeNull();
    });
  });

  describe('Society Name Validation (Regional & English)', () => {
    it('should require Society Name (Regional)', () => {
      expect(validateSingleField('societyName', '')).not.toBeNull();
      expect(validateSingleField('societyName', '   ')).not.toBeNull();
    });

    it('should reject society names with invalid symbols like >>>>>>>>', () => {
      expect(validateSingleField('societyName', 'गोकुळधाम >>>>>>>>>')).not.toBeNull();
      expect(validateSingleField('societyNameEnglish', 'Gokuldham >>>>>>>>>')).not.toBeNull();
    });

    it('should accept valid regional and English society names with building numbers and plus sign', () => {
      expect(
        validateSingleField(
          'societyName',
          'गोकुळधाम कॉं ऑप हौसिंग सोसायटी क विंग साई श्रद्धा बिल्डिंग ग्राउंड + ८ फ्लॉवर'
        )
      ).toBeNull();
      expect(
        validateSingleField(
          'societyNameEnglish',
          'GOKULDHAM CO OP HOUSING SOCIETY C WING SAI SHRADDHA BUILDING G+8'
        )
      ).toBeNull();
    });
  });

  describe('Address Validation', () => {
    it('should reject address with symbols like >>>>>>>>> or repeated characters', () => {
      expect(validateSingleField('societyAddress', 'सिद्धार्थ नगर >>>>>>>>>')).not.toBeNull();
      expect(validateSingleField('societyAddressEnglish', 'Sidharth Nagar >>>>>>>>>')).not.toBeNull();
    });

    it('should accept valid addresses', () => {
      expect(
        validateSingleField(
          'societyAddress',
          'सिद्धार्थ नगर कोपरी कॉलनी साई तीर्थ टॉवर मागे कोपरी'
        )
      ).toBeNull();
      expect(
        validateSingleField(
          'societyAddressEnglish',
          'SIDHARTH NAGAR KOPRI COLONY BEHIND SAI TIRTH TOWER'
        )
      ).toBeNull();
    });
  });

  describe('Mobile Number Validation', () => {
    it('should validate 10-digit Indian mobile numbers', () => {
      expect(validateSingleField('builderMobileNo', '9838569559')).toBeNull();
      expect(validateSingleField('managerMobileNo', '9876543210')).toBeNull();
      expect(validateSingleField('builderMobileNo', '1234567890')).not.toBeNull();
      expect(validateSingleField('builderMobileNo', '9999999999')).not.toBeNull();
      expect(validateSingleField('builderMobileNo', '983856')).not.toBeNull();
    });
  });

  describe('validateAllSocietyFields', () => {
    it('should catch errors across all fields in form', () => {
      const mockForm: ApartmentEditFormData = {
        propertyNo: '101',
        upic: 'UPIC-101',
        societyName: 'गोकुळधाम >>>>>',
        societyNameEnglish: 'Gokuldham >>>>>',
        propertyDescription: 'निवासी',
        division: 'दिवा',
        wardNo: '1',
        category: 'Apartment',
        taxZoneAndName: '1 - A',
        subZoneCsnNo: 'CSN-1',
        plotNo: '10',
        societyAddress: 'सिद्धार्थ नगर >>>>>',
        societyAddressEnglish: 'Sidharth Nagar >>>>>',
        landOwnerName: 'मालक $$$$',
        landOwnerNameEnglish: 'Owner $$$$',
        builderName: 'आदित्य कांबळे>>>>>>>>>>>',
        builderNameEnglish: 'aditya kamble>>>>>>>>>>>',
        builderMobileNo: '12345',
        societyEmail: 'ramchandra@gmail.commmmmm',
        managerName: 'मैनेजर %%%%',
        managerMobileNo: '9999999999',
        managerEmail: 'mgr@domain.coooom',
        secretaryName: 'सेक्रेटरी ****',
        secretaryMobileNo: '0000000000',
        secretaryEmail: 'sec@gmail.con',
      };

      const errors = validateAllSocietyFields(mockForm);
      expect(Object.keys(errors).length).toBeGreaterThanOrEqual(10);
      expect(errors.societyName).toBeDefined();
      expect(errors.builderName).toBeDefined();
      expect(errors.builderNameEnglish).toBeDefined();
      expect(errors.societyEmail).toBeDefined();
      expect(errors.managerEmail).toBeDefined();
      expect(errors.secretaryEmail).toBeDefined();
      expect(errors.builderMobileNo).toBeDefined();
    });
  });
});
