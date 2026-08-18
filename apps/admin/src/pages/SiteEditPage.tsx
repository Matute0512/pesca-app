import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../api/client';
import { MapPicker } from '../components/MapPicker';
import { SITE_TYPES, siteTypeLabel } from '../lib/labels';

interface AdminSite {
  id: string;
  name: string;
  slug: string;
  siteType: string;
  latitude: number;
  longitude: number;
  descriptionShort: string | null;
  locality: string | null;
  municipality: string | null;
  province: string | null;
  phone: string | null;
  website: string | null;
  accessType: string | null;
  ownershipType: string | null;
  isPublic: boolean;
  isVerified: boolean;
  allowsBoats: boolean;
  allowsNightFishing: boolean;
  allowsCamping: boolean;
  species: Array<{ species: { id: string; slug: string } }>;
  amenities: Array<{ amenityType: string }>;
}

interface SpeciesOption {
  id: string;
  slug: string;
  commonNameEs: string;
}

interface AmenityOption {
  value: string;
  labelEs: string;
}

const ACCESS_TYPES = ['public', 'permit_required', 'paid', 'free', 'car', 'offroad', 'walking', 'boat'];

export function SiteEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [form, setForm] = useState({
    name: '',
    siteType: 'lagoon',
    latitude: -34.92,
    longitude: -57.95,
    descriptionShort: '',
    locality: '',
    municipality: '',
    province: '',
    phone: '',
    website: '',
    accessType: 'public',
    ownershipType: 'public',
    isPublic: true,
    allowsBoats: false,
    allowsNightFishing: false,
    allowsCamping: false,
  });
  const [speciesIds, setSpeciesIds] = useState<string[]>([]);
  const [amenities, setAmenities] = useState<string[]>([]);
  const [speciesOptions, setSpeciesOptions] = useState<SpeciesOption[]>([]);
  const [amenityOptions, setAmenityOptions] = useState<AmenityOption[]>([]);
  const [isVerified, setIsVerified] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get<SpeciesOption[]>('/species').then(setSpeciesOptions).catch(() => undefined);
    api.get<AmenityOption[]>('/amenities').then(setAmenityOptions).catch(() => undefined);
  }, []);

  useEffect(() => {
    if (id) {
      api
        .get<AdminSite>(`/admin/sites/${id}`)
        .then((site) => {
          setForm({
            name: site.name,
            siteType: site.siteType,
            latitude: site.latitude,
            longitude: site.longitude,
            descriptionShort: site.descriptionShort ?? '',
            locality: site.locality ?? '',
            municipality: site.municipality ?? '',
            province: site.province ?? '',
            phone: site.phone ?? '',
            website: site.website ?? '',
            accessType: site.accessType ?? 'public',
            ownershipType: site.ownershipType ?? 'public',
            isPublic: site.isPublic,
            allowsBoats: site.allowsBoats,
            allowsNightFishing: site.allowsNightFishing,
            allowsCamping: site.allowsCamping,
          });
          setSpeciesIds(site.species.map((s) => s.species.id));
          setAmenities(site.amenities.map((a) => a.amenityType));
          setIsVerified(site.isVerified);
        })
        .catch((err) => setError(err instanceof Error ? err.message : 'Error'));
    }
  }, [id]);

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function toggleInList(list: string[], setter: (v: string[]) => void, value: string) {
    setter(list.includes(value) ? list.filter((x) => x !== value) : [...list, value]);
  }

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const payload = {
      ...form,
      descriptionShort: form.descriptionShort || null,
      locality: form.locality || null,
      municipality: form.municipality || null,
      province: form.province || null,
      phone: form.phone || null,
      website: form.website || null,
      speciesIds,
      amenities,
    };
    try {
      if (isEdit) {
        await api.patch(`/admin/sites/${id}`, payload);
      } else {
        await api.post('/admin/sites', payload);
      }
      navigate('/sites');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setSaving(false);
    }
  }

  async function handleVerify() {
    if (!id) return;
    if (!window.confirm('¿Confirmar la verificación de este lugar?')) return;
    try {
      await api.post(`/admin/sites/${id}/verify`);
      setIsVerified(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    }
  }

  async function handleDelete() {
    if (!id) return;
    if (!window.confirm('¿Eliminar este lugar? (soft delete)')) return;
    try {
      await api.del(`/admin/sites/${id}`);
      navigate('/sites');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1>{isEdit ? 'Editar lugar' : 'Nuevo lugar'}</h1>
        {isEdit && (
          <div className="actions">
            {isVerified ? (
              <span className="badge badge-ok">Verificado</span>
            ) : (
              <button type="button" className="btn" onClick={handleVerify}>
                Verificar
              </button>
            )}
            <button type="button" className="btn btn-danger" onClick={handleDelete}>
              Eliminar
            </button>
          </div>
        )}
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <form onSubmit={handleSave} className="form-grid">
        <div className="form-main">
          <label>
            Nombre *
            <input required value={form.name} onChange={(e) => update('name', e.target.value)} />
          </label>

          <label>
            Tipo de lugar
            <select value={form.siteType} onChange={(e) => update('siteType', e.target.value)}>
              {SITE_TYPES.map((t) => (
                <option key={t} value={t}>
                  {siteTypeLabel(t)}
                </option>
              ))}
            </select>
          </label>

          <label>
            Descripción corta
            <textarea value={form.descriptionShort} onChange={(e) => update('descriptionShort', e.target.value)} rows={3} />
          </label>

          <div className="row">
            <label>
              Localidad
              <input value={form.locality} onChange={(e) => update('locality', e.target.value)} />
            </label>
            <label>
              Municipio / Partido
              <input value={form.municipality} onChange={(e) => update('municipality', e.target.value)} />
            </label>
          </div>

          <div className="row">
            <label>
              Provincia
              <input value={form.province} onChange={(e) => update('province', e.target.value)} />
            </label>
            <label>
              Teléfono
              <input value={form.phone} onChange={(e) => update('phone', e.target.value)} />
            </label>
          </div>

          <label>
            Sitio web
            <input value={form.website} onChange={(e) => update('website', e.target.value)} placeholder="https://…" />
          </label>

          <div className="row">
            <label>
              Acceso
              <select value={form.accessType} onChange={(e) => update('accessType', e.target.value)}>
                {ACCESS_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Propiedad
              <select value={form.ownershipType} onChange={(e) => update('ownershipType', e.target.value)}>
                {['public', 'private', 'club', 'municipal', 'provincial', 'national', 'unknown'].map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="checks">
            {([
              ['isPublic', 'Es de acceso público'],
              ['allowsBoats', 'Permite embarcaciones'],
              ['allowsNightFishing', 'Permite pesca nocturna'],
              ['allowsCamping', 'Permite camping'],
            ] as const).map(([key, label]) => (
              <label key={key} className="check">
                <input type="checkbox" checked={form[key]} onChange={(e) => update(key, e.target.checked)} />
                {label}
              </label>
            ))}
          </div>

          <fieldset>
            <legend>Especies habituales</legend>
            <div className="chips">
              {speciesOptions.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  className={`chip ${speciesIds.includes(s.id) ? 'on' : ''}`}
                  onClick={() => toggleInList(speciesIds, setSpeciesIds, s.id)}
                >
                  {s.commonNameEs}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend>Servicios</legend>
            <div className="chips">
              {amenityOptions.map((a) => (
                <button
                  key={a.value}
                  type="button"
                  className={`chip ${amenities.includes(a.value) ? 'on' : ''}`}
                  onClick={() => toggleInList(amenities, setAmenities, a.value)}
                >
                  {a.labelEs}
                </button>
              ))}
            </div>
          </fieldset>
        </div>

        <div className="form-side">
          <label>
            Coordenadas
            <input value={`${form.latitude}, ${form.longitude}`} readOnly />
          </label>
          <MapPicker
            latitude={form.latitude}
            longitude={form.longitude}
            onChange={(lat, lng) => {
              update('latitude', lat);
              update('longitude', lng);
            }}
          />
          <p className="muted">Hacé clic sobre el mapa para mover el punto.</p>
        </div>

        <div className="form-footer">
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Guardando…' : isEdit ? 'Guardar cambios' : 'Crear lugar'}
          </button>
        </div>
      </form>
    </div>
  );
}
