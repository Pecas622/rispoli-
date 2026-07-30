// Códigos telefónicos para el selector del registro. Cubre LATAM (el mercado
// del sitio) más España y Estados Unidos, de donde también llegan alumnos.
// Argentina va primero por ser el mercado principal; el resto, alfabético.
export const COUNTRY_CODES = [
  { iso: 'AR', dial: '+54',  flag: '🇦🇷', name: 'Argentina' },
  { iso: 'BO', dial: '+591', flag: '🇧🇴', name: 'Bolivia' },
  { iso: 'BR', dial: '+55',  flag: '🇧🇷', name: 'Brasil' },
  { iso: 'CL', dial: '+56',  flag: '🇨🇱', name: 'Chile' },
  { iso: 'CO', dial: '+57',  flag: '🇨🇴', name: 'Colombia' },
  { iso: 'CR', dial: '+506', flag: '🇨🇷', name: 'Costa Rica' },
  { iso: 'CU', dial: '+53',  flag: '🇨🇺', name: 'Cuba' },
  { iso: 'EC', dial: '+593', flag: '🇪🇨', name: 'Ecuador' },
  { iso: 'SV', dial: '+503', flag: '🇸🇻', name: 'El Salvador' },
  { iso: 'ES', dial: '+34',  flag: '🇪🇸', name: 'España' },
  { iso: 'US', dial: '+1',   flag: '🇺🇸', name: 'Estados Unidos' },
  { iso: 'GT', dial: '+502', flag: '🇬🇹', name: 'Guatemala' },
  { iso: 'HN', dial: '+504', flag: '🇭🇳', name: 'Honduras' },
  { iso: 'MX', dial: '+52',  flag: '🇲🇽', name: 'México' },
  { iso: 'NI', dial: '+505', flag: '🇳🇮', name: 'Nicaragua' },
  { iso: 'PA', dial: '+507', flag: '🇵🇦', name: 'Panamá' },
  { iso: 'PY', dial: '+595', flag: '🇵🇾', name: 'Paraguay' },
  { iso: 'PE', dial: '+51',  flag: '🇵🇪', name: 'Perú' },
  { iso: 'PR', dial: '+1',   flag: '🇵🇷', name: 'Puerto Rico' },
  { iso: 'DO', dial: '+1',   flag: '🇩🇴', name: 'República Dominicana' },
  { iso: 'UY', dial: '+598', flag: '🇺🇾', name: 'Uruguay' },
  { iso: 'VE', dial: '+58',  flag: '🇻🇪', name: 'Venezuela' },
];

export const DEFAULT_COUNTRY = 'AR';

export function findCountry(iso) {
  return COUNTRY_CODES.find(c => c.iso === iso);
}
