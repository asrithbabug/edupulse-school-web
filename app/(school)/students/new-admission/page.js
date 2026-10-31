'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeftIcon, UserPlusIcon } from '@heroicons/react/24/outline';
import { api } from '@/lib/api';
import { shareSetupLink } from '@/lib/setupLink';

const classNumbers = ['Nursery', 'LKG', 'UKG', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
const sections    = ['A', 'B', 'C', 'D', 'E'];
const mediums     = ['English', 'Telugu', 'Hindi', 'Urdu'];
const languages   = ['Telugu', 'Hindi', 'English', 'Urdu', 'Tamil', 'Kannada'];
const religions   = ['Hindu', 'Muslim', 'Christian', 'Sikh', 'Buddhist', 'Jain', 'Other'];
const parentTypes = ['Father', 'Mother', 'Guardian'];

const locationHierarchy = {
  'Andhra Pradesh': {
    Anantapur: {
      Tadipatri: ['Yadiki', 'Peddapappur', 'Ramagiri'],
      Gooty: ['Peddavadugur', 'Guntakal Rural', 'Mamidipalli'],
      Uravakonda: ['Beluguppa', 'Vidapanakal', 'Rayadurgam Rural'],
    },
    Chittoor: {
      Tirupati: ['Renigunta', 'Yerpedu', 'Thondavada'],
      Madanapalle: ['B.Kothakota', 'Nimmanapalle', 'Kurabalakota'],
      Punganur: ['Sodam', 'Somala', 'Chowdepalle'],
    },
    Kurnool: {
      Adoni: ['Peddakadubur', 'Kosigi', 'Aspari'],
      Nandyal: ['Gospadu', 'Sanjamala', 'Banaganapalle'],
      Kurnool: ['Orvakal', 'Kodumur', 'C.Belagal'],
    },
    'East Godavari': {
      Kakinada: ['Samalkota', 'Pithapuram', 'Gollaprolu'],
      Rajahmundry: ['Korukonda', 'Seethanagaram', 'Kadiam'],
      Amalapuram: ['Allavaram', 'Mummidivaram', 'Ambajipeta'],
    },
  },
  Telangana: {
    Hyderabad: {
      Amberpet: ['Golnaka', 'Ramanthapur', 'Barkatpura'],
      Secunderabad: ['Maredpally', 'Trimulgherry', 'Bowenpally'],
      Charminar: ['Shalibanda', 'Bahadurpura', 'Falaknuma'],
    },
    Warangal: {
      Hanamkonda: ['Kakaji Colony', 'Subedari', 'Kumarpally'],
      Parkal: ['Atmakur', 'Sangam', 'Shayampet'],
      Narsampet: ['Chennaraopet', 'Duggondi', 'Nallabelly'],
    },
    Nizamabad: {
      Bodhan: ['Erajpally', 'Hunsa', 'Mavandi Kalan'],
      Armoor: ['Mendora', 'Nandipet', 'Mupkal'],
      Bheemgal: ['Velpur', 'Dichpally', 'Makloor'],
    },
    Karimnagar: {
      Huzurabad: ['Veenavanka', 'Jammikunta', 'Shankarapatnam'],
      Jagtial: ['Mallapur', 'Raikal', 'Sarangapur'],
      Manakondur: ['Thimmapur', 'Vavilala', 'Ganneruvaram'],
    },
  },
};

function Field({ label, required, error, children }) {
  return (
    <div>
      <label className="text-sm font-medium text-text-secondary mb-1 block">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}

function SectionTitle({ title }) {
  return (
    <div className="border-b border-border pb-2 mb-4">
      <h3 className="text-sm font-semibold text-text-primary uppercase tracking-wide">{title}</h3>
    </div>
  );
}

export default function NewAdmissionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('edit');
  const [saving, setSaving]   = useState(false);
  const [errors, setErrors]   = useState({});
  const [loadingStudent, setLoadingStudent] = useState(Boolean(editId));
  const [formData, setFormData] = useState({
    // Student Information
    name:           '',
    dob:            '',
    gender:         '',
    aadhaar:        '',
    motherTongue:   '',
    nationality:    'Indian',
    religion:       '',
    caste:          '',
    // Academic Details
    classNum:       '1',
    section:        '',
    admissionNo:    '',
    admissionDate:  new Date().toISOString().split('T')[0],
    medium:         'English',
    firstLanguage:  'Telugu',
    previousClass:  '',
    previousSchool: '',
    qualifiedForPromotion: '',
    tcNo:           '',
    tcDate:         '',
    // Parent Information
    parentType:     '',
    parentName:     '',
    parentMobile:   '',
    parentEmail:    '',
    parentAadhaar:  '',
    occupation:     '',
    // Address
    houseNo:        '',
    addressLine:    '',
    landmark:       '',
    state:          '',
    mandal:         '',
    district:       '',
    pin:            '',
    // Additional
    vaccinated:     '',
    identificationMark1: '',
    identificationMark2: '',
    conduct:        '',
  });

  useEffect(() => {
    if (!editId) return;

    async function loadStudent() {
      try {
        const student = await api.getStudent(editId);

        const [classNum, section] = String(student.class || '').split('-');
        setFormData((current) => ({
          ...current,
          id: student.id,
          name: student.name || '',
          dob: student.date_of_birth ? new Date(student.date_of_birth).toISOString().split('T')[0] : '',
          gender: student.gender || '',
          classNum: classNum || current.classNum,
          section: section || student.section || current.section,
          admissionNo: student.roll_no || '',
          parentName: student.parent_name || '',
          parentMobile: student.phone || '',
          parentEmail: student.email || '',
        }));
      } catch (err) {
        setErrors({ submit: err.message || 'Failed to load student.' });
      } finally {
        setLoadingStudent(false);
      }
    }

    loadStudent();
  }, [editId]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: undefined }));
  };

  const handleStateChange = (value) => {
    setFormData((prev) => ({
      ...prev,
      state: value,
      district: '',
      mandal: '',
    }));
    setErrors((prev) => ({ ...prev, state: undefined, district: undefined, mandal: undefined }));
  };

  const handleDistrictChange = (value) => {
    setFormData((prev) => ({
      ...prev,
      district: value,
      mandal: '',
    }));
    setErrors((prev) => ({ ...prev, district: undefined, mandal: undefined }));
  };

  const handleMandalChange = (value) => {
    setFormData((prev) => ({
      ...prev,
      mandal: value,
    }));
    setErrors((prev) => ({ ...prev, mandal: undefined }));
  };

  const districtOptions = formData.state ? Object.keys(locationHierarchy[formData.state] || {}) : [];
  const mandalOptions = formData.state && formData.district
    ? Object.keys(locationHierarchy[formData.state]?.[formData.district] || {})
    : [];

  const validate = () => {
    const errs = {};
    if (!formData.name.trim())        errs.name        = 'Name is required';
    if (!formData.dob)                errs.dob         = 'Date of birth is required';
    if (!formData.gender)             errs.gender      = 'Gender is required';
    if (!/^\d{12}$/.test(formData.aadhaar.replace(/\D/g, ''))) errs.aadhaar = 'Valid 12-digit Aadhaar is required';
    if (!formData.identificationMark1.trim()) errs.identificationMark1 = 'Personal identification mark 1 is required';
    if (!formData.identificationMark2.trim()) errs.identificationMark2 = 'Personal identification mark 2 is required';
    if (!formData.parentType)         errs.parentType = 'Parent type is required';
    if (!formData.parentName.trim())  errs.parentName = 'Parent name is required';
    if (!formData.parentMobile.trim()) errs.parentMobile = 'Mobile number is required';
    else if (!/^\d{10}$/.test(formData.parentMobile.replace(/\D/g, ''))) errs.parentMobile = 'Mobile number must be 10 digits';
    if (formData.parentEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.parentEmail)) errs.parentEmail = 'Invalid email';
    if (!/^\d{12}$/.test(formData.parentAadhaar.replace(/\D/g, ''))) errs.parentAadhaar = 'Valid 12-digit Aadhaar is required';
    if (!formData.occupation.trim())  errs.occupation = 'Occupation is required';
    if (!formData.state)              errs.state      = 'State is required';
    if (!formData.district.trim())    errs.district   = 'District is required';
    if (!formData.mandal.trim())      errs.mandal     = 'Mandal is required';
    if (formData.pin && !/^\d{6}$/.test(formData.pin)) errs.pin = 'PIN code must be 6 digits';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      const payload = {
        name:           formData.name,
        class:          formData.section ? `${formData.classNum}-${formData.section}` : formData.classNum,
        section:        formData.section || null,
        parent_type:    formData.parentType,
        parent_name:    formData.parentName,
        parent_mobile:  formData.parentMobile,
        parent_email:   formData.parentEmail || undefined,
        parent_aadhaar: formData.parentAadhaar,
        occupation:     formData.occupation,
        gender:         formData.gender,
        date_of_birth:  formData.dob,
        admission_date: formData.admissionDate,
        aadhaar:        formData.aadhaar,
        mother_tongue:  formData.motherTongue || undefined,
        nationality:    formData.nationality,
        religion:       formData.religion || undefined,
        caste:          formData.caste || undefined,
        medium:         formData.medium,
        first_language: formData.firstLanguage,
        address:        [formData.houseNo, formData.addressLine, formData.landmark, formData.mandal, formData.district, formData.state, formData.pin].filter(Boolean).join(', '),
        address_line:   formData.addressLine || undefined,
        landmark:       formData.landmark || undefined,
        state:          formData.state,
        village:        formData.addressLine || formData.landmark || 'NA',
        mandal:         formData.mandal,
        district:       formData.district,
        pin:            formData.pin || undefined,
        previous_class: formData.previousClass || undefined,
        previous_school: formData.previousSchool || undefined,
        tc_no:          formData.tcNo || undefined,
        tc_date:        formData.tcDate || undefined,
        vaccinated:     formData.vaccinated || undefined,
        identification_marks: [formData.identificationMark1, formData.identificationMark2].filter(Boolean).join('; ') || undefined,
        conduct:        formData.conduct || undefined,
      };
      if (editId) {
        await api.updateStudent(editId, {
          name: formData.name,
          class: formData.section ? `${formData.classNum}-${formData.section}` : formData.classNum,
          section: formData.section || null,
          roll_no: formData.admissionNo,
          parent_name: formData.parentName,
          phone: formData.parentMobile,
          email: formData.parentEmail || undefined,
        });
      } else {
        shareSetupLink(await api.createStudent(payload), 'parent');
      }
      router.push('/students');
    } catch (err) {
      setErrors({ submit: err.message || 'Failed to save. Please try again.' });
    }
    setSaving(false);
  };

  if (loadingStudent) return <div className="p-6 text-sm text-text-secondary">Loading student...</div>;

  return (
    <div className="space-y-6 max-w-4xl">

      {/* Page Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <ArrowLeftIcon className="w-5 h-5 text-text-secondary" />
        </button>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
            <UserPlusIcon className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-text-primary">{editId ? 'Edit Student' : 'New Admission'}</h2>
            <p className="text-text-secondary text-sm mt-0.5">{editId ? 'Update student details' : 'Register a fresh student — fill all required fields'}</p>
          </div>
        </div>
      </div>

      {errors.submit && (
        <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">{errors.submit}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* ── 1. Student Information ── */}
        <div className="bg-white rounded-xl border border-border p-6">
          <SectionTitle title="1. Student Information" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Field label="Full Name (with Surname)" required error={errors.name}>
              <input type="text" value={formData.name} onChange={e => handleChange('name', e.target.value)}
                className={`input-field ${errors.name ? 'border-red-400' : ''}`} placeholder="Surname First" />
            </Field>
            <Field label="Student ID">
              <input type="text" value={formData.id || 'Generated after admission'} readOnly disabled
                className="input-field bg-gray-100 text-gray-500 cursor-not-allowed" />
            </Field>
            <Field label="Date of Birth" required error={errors.dob}>
              <input type="date" value={formData.dob} onChange={e => handleChange('dob', e.target.value)}
                className={`input-field ${errors.dob ? 'border-red-400' : ''}`} />
            </Field>
            <Field label="Gender" required error={errors.gender}>
              <select value={formData.gender} onChange={e => handleChange('gender', e.target.value)}
                className={`input-field ${errors.gender ? 'border-red-400' : ''}`}>
                <option value="">Select</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </Field>
            <Field label="Aadhaar No" required error={errors.aadhaar}>
              <input type="text" value={formData.aadhaar} onChange={e => handleChange('aadhaar', e.target.value)}
                className={`input-field ${errors.aadhaar ? 'border-red-400' : ''}`} placeholder="12-digit Aadhaar" maxLength={14} />
            </Field>
            <Field label="Mother Tongue">
              <select value={formData.motherTongue} onChange={e => handleChange('motherTongue', e.target.value)}
                className="input-field">
                <option value="">Select</option>
                {languages.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </Field>
            <Field label="Nationality">
              <input type="text" value={formData.nationality} onChange={e => handleChange('nationality', e.target.value)}
                className="input-field" />
            </Field>
            <Field label="Religion">
              <select value={formData.religion} onChange={e => handleChange('religion', e.target.value)}
                className="input-field">
                <option value="">Select</option>
                {religions.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </Field>
            <Field label="Caste">
              <input type="text" value={formData.caste} onChange={e => handleChange('caste', e.target.value)}
                className="input-field" placeholder="e.g. BC-D" />
            </Field>
          </div>
        </div>

        {/* ── 2. Parent Information ── */}
        <div className="bg-white rounded-xl border border-border p-6">
          <SectionTitle title="2. Parent Information" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Parent Type" required error={errors.parentType}>
              <select
                value={formData.parentType}
                onChange={e => handleChange('parentType', e.target.value)}
                className={`input-field ${errors.parentType ? 'border-red-400' : ''}`}
              >
                <option value="">Select</option>
                {parentTypes.map((type) => <option key={type} value={type}>{type}</option>)}
              </select>
            </Field>
          </div>

          {formData.parentType && (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2 text-sm font-semibold text-text-primary">
                {formData.parentType} Details
              </div>
              <Field label="Parent Name" required error={errors.parentName}>
                <input
                  type="text"
                  value={formData.parentName}
                  onChange={e => handleChange('parentName', e.target.value)}
                  className={`input-field ${errors.parentName ? 'border-red-400' : ''}`}
                  placeholder={`${formData.parentType} full name`}
                />
              </Field>
              <Field label="Mobile Number" required error={errors.parentMobile}>
                <input
                  type="tel"
                  value={formData.parentMobile}
                  onChange={e => handleChange('parentMobile', e.target.value)}
                  className={`input-field ${errors.parentMobile ? 'border-red-400' : ''}`}
                  placeholder="10-digit mobile number"
                  maxLength={10}
                />
              </Field>
              <Field label="Email Address" error={errors.parentEmail}>
                <input
                  type="email"
                  value={formData.parentEmail}
                  onChange={e => handleChange('parentEmail', e.target.value)}
                  className={`input-field ${errors.parentEmail ? 'border-red-400' : ''}`}
                  placeholder="parent@email.com"
                />
              </Field>
              <Field label="Aadhaar Number" required error={errors.parentAadhaar}>
                <input
                  type="text"
                  value={formData.parentAadhaar}
                  onChange={e => handleChange('parentAadhaar', e.target.value)}
                  className={`input-field ${errors.parentAadhaar ? 'border-red-400' : ''}`}
                  placeholder="12-digit Aadhaar"
                  maxLength={14}
                />
              </Field>
              <Field label="Occupation" required error={errors.occupation}>
                <input
                  type="text"
                  value={formData.occupation}
                  onChange={e => handleChange('occupation', e.target.value)}
                  className={`input-field ${errors.occupation ? 'border-red-400' : ''}`}
                  placeholder="Occupation"
                />
              </Field>
            </div>
          )}
        </div>

        {/* ── 3. Address ── */}
        <div className="bg-white rounded-xl border border-border p-6">
          <SectionTitle title="3. Address" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Field label="House No">
              <input type="text" value={formData.houseNo} onChange={e => handleChange('houseNo', e.target.value)}
                className="input-field" placeholder="H.No" />
            </Field>
            <Field label="Address Line">
              <input type="text" value={formData.addressLine} onChange={e => handleChange('addressLine', e.target.value)}
                className="input-field" placeholder="Street / Area" />
            </Field>
            <Field label="Landmark">
              <input type="text" value={formData.landmark} onChange={e => handleChange('landmark', e.target.value)}
                className="input-field" placeholder="Near temple, bus stand..." />
            </Field>
            <Field label="State" required error={errors.state}>
              <select
                value={formData.state}
                onChange={e => handleStateChange(e.target.value)}
                className={`input-field ${errors.state ? 'border-red-400' : ''}`}
              >
                <option value="">Select State</option>
                {Object.keys(locationHierarchy).map((state) => (
                  <option key={state} value={state}>{state}</option>
                ))}
              </select>
            </Field>
            <Field label="District" required error={errors.district}>
              <select
                value={formData.district}
                onChange={e => handleDistrictChange(e.target.value)}
                disabled={!formData.state}
                className={`input-field ${errors.district ? 'border-red-400' : ''} ${!formData.state ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : ''}`}
              >
                <option value="">Select District</option>
                {districtOptions.map((district) => (
                  <option key={district} value={district}>{district}</option>
                ))}
              </select>
            </Field>
            <Field label="Mandal" required error={errors.mandal}>
              <select
                value={formData.mandal}
                onChange={e => handleMandalChange(e.target.value)}
                disabled={!formData.district}
                className={`input-field ${errors.mandal ? 'border-red-400' : ''} ${!formData.district ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : ''}`}
              >
                <option value="">Select Mandal</option>
                {mandalOptions.map((mandal) => (
                  <option key={mandal} value={mandal}>{mandal}</option>
                ))}
              </select>
            </Field>
            <Field label="PIN Code" error={errors.pin}>
              <input type="text" value={formData.pin} onChange={e => handleChange('pin', e.target.value)}
                className={`input-field ${errors.pin ? 'border-red-400' : ''}`} placeholder="6-digit PIN" maxLength={6} />
            </Field>
          </div>
        </div>

        {/* ── 4. Academic Details ── */}
        <div className="bg-white rounded-xl border border-border p-6">
          <SectionTitle title="4. Academic Details" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Field label="Admission Seeking for Class" required>
              <select value={formData.classNum} onChange={e => handleChange('classNum', e.target.value)}
                className="input-field">
                {classNumbers.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Section">
              <select value={formData.section} onChange={e => handleChange('section', e.target.value)}
                className="input-field">
                <option value="">Select section (optional)</option>
                {sections.map(s => <option key={s} value={s}>Section {s}</option>)}
              </select>
            </Field>
            <Field label="Admission No" error={errors.admissionNo}>
              <input
                type="text"
                value={formData.admissionNo || 'Auto-generated after submission'}
                readOnly
                disabled
                className="input-field bg-gray-100 text-gray-500 cursor-not-allowed"
              />
            </Field>
            <Field label="Admission Date">
              <input type="date" value={formData.admissionDate} readOnly disabled
                className="input-field bg-gray-100 text-gray-500 cursor-not-allowed" />
            </Field>
            <Field label="Medium">
              <select value={formData.medium} onChange={e => handleChange('medium', e.target.value)}
                className="input-field">
                {mediums.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </Field>
            <Field label="Previous School">
              <input type="text" value={formData.previousSchool} onChange={e => handleChange('previousSchool', e.target.value)}
                className="input-field" placeholder="Previous school name" />
            </Field>
            <Field label="T.C. No">
              <input type="text" value={formData.tcNo} onChange={e => handleChange('tcNo', e.target.value)}
                className="input-field" placeholder="Transfer certificate number" />
            </Field>
            <Field label="T.C. Date">
              <input type="date" value={formData.tcDate} onChange={e => handleChange('tcDate', e.target.value)}
                className="input-field" />
            </Field>
          </div>
        </div>

        {/* ── 5. Additional Details ── */}
        <div className="bg-white rounded-xl border border-border p-6">
          <SectionTitle title="5. Additional Details" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Personal Identification Mark 1" required error={errors.identificationMark1}>
              <input type="text" value={formData.identificationMark1} onChange={e => handleChange('identificationMark1', e.target.value)}
                className={`input-field ${errors.identificationMark1 ? 'border-red-400' : ''}`} placeholder="e.g. Mole on left cheek" />
            </Field>
            <Field label="Personal Identification Mark 2" required error={errors.identificationMark2}>
              <input type="text" value={formData.identificationMark2} onChange={e => handleChange('identificationMark2', e.target.value)}
                className={`input-field ${errors.identificationMark2 ? 'border-red-400' : ''}`} placeholder="e.g. Scar on right hand" />
            </Field>
          </div>
        </div>

        {/* ── Actions ── */}
        <div className="bg-white rounded-xl border border-border p-4 flex justify-end gap-3">
          <button type="button" onClick={() => router.back()} className="btn-secondary">
            Cancel
          </button>
          <button type="submit" disabled={saving} className="btn-primary disabled:opacity-50">
            {saving ? 'Saving...' : editId ? 'Update Student' : 'Save Admission'}
          </button>
        </div>

      </form>
    </div>
  );
}
