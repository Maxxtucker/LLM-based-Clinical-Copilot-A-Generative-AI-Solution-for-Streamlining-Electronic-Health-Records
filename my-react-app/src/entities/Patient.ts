export interface VitalSigns {
  blood_pressure?: string;
  heart_rate?: string;
  temperature?: string;
  weight?: string;
  height?: string;
}

export interface Patient {
  first_name: string;
  last_name: string;
  date_of_birth: string; // or Date if you parse it
  gender?: 'male' | 'female' | 'other';
  phone?: string;
  email?: string;
  address?: string;
  medical_record_number: string;
  chief_complaint?: string;
  medical_history?: string;
  current_medications?: string;
  allergies?: string;
  vital_signs?: VitalSigns;
  symptoms?: string;
  lab_results?: string;
  diagnosis?: string;
  treatment_plan?: string;
  ai_summary?: string;
  status?: 'active' | 'inactive' | 'discharged';
}
