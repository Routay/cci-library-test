import { useState, useCallback } from 'react';
import { useUsers } from '../../hooks/useUsers';
import { useAuth } from '../../context/AuthContext';
import { usersAPI } from '../../services/api';
import { XCircle, Pencil, UserPlus, Search, User, Trash2, Eye, Download, Filter, BookOpen, Clock, AlertTriangle, CheckCircle } from 'lucide-react';
import './AdminMembres.css';

const EMPTY = { nom:'', prenom:'', email:'', tel:'', actif:true, role:'membre', password:'', etablissement:'', sexe:'', departement:'', logeCampus:false, chambre:'' };
const STATUS_LABELS = { en_attente:'En attente', actif:'Actif', retard:'En retard', rendu:'Rendu' };
const STATUS_CLASS  = { en_attente:'badge-warn', actif:'badge-actif', retard:'badge-retard', rendu:'badge-rendu' };

function Spinner() { return <div className="dash-spinner-wrap"><div className="dash-spinner" /></div>; }

export default function AdminMembres() {
  const { users, loading, error, createUser, updateUser, toggleActive, deleteUser } = useUsers();
  const { admin } = useAuth();
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('tous');
  const [filterEtab, setFilterEtab] = useState('tous');
  const [modal, setModal] = useState(null);
  const [current, setCurrent] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [apiError, setApiError] = useState('');
  const [detailData, setDetailData] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const filtered = users.filter(u => {
    const s = `${u.prenom} ${u.nom} ${u.email}`.toLowerCase().includes(search.toLowerCase());
    const st = filterStatus==='tous' || (filterStatus==='actif' ? u.actif : !u.actif);
    const et = filterEtab==='tous' || u.etablissement===filterEtab;
    return s && st && et;
  });

  const openAdd = () => { setCurrent(EMPTY); setApiError(''); setModal('add'); };
  const openEdit = u => { setCurrent({...u}); setApiError(''); setModal('edit'); };
  const openDetail = useCallback(async u => {
    setDetailLoading(true); setDetailData(null); setModal('detail'); setCurrent(u);
    try { const {data} = await usersAPI.getHistory(u._id); setDetailData(data); }
    catch { setDetailData({user:u, loans:[], stats:{total:0,actifs:0,enRetard:0,rendus:0,enAttente:0}}); }
    finally { setDetailLoading(false); }
  }, []);
  const openDelete = u => { setDeleteTarget(u); setApiError(''); setModal('delete'); };

  const handleDelete = async () => {
    if (!deleteTarget) return; setSaving(true); setApiError('');
    try { await deleteUser(deleteTarget._id); setModal(null); setDeleteTarget(null); }
    catch(err) { setApiError(err.response?.data?.message || 'Erreur suppression'); }
    finally { setSaving(false); }
  };

  const save = async () => {
    if (!current.nom || !current.email) return; setSaving(true); setApiError('');
    try {
      if (modal==='add') await createUser(current); else await updateUser(current._id, current);
      setModal(null);
    } catch(err) { setApiError(err.response?.data?.message || 'Erreur sauvegarde'); }
    finally { setSaving(false); }
  };

  const handleToggle = async id => {
    try { await toggleActive(id); } catch(e) { alert(e.response?.data?.message || 'Erreur'); }
  };

  const exportCSV = () => {
    const h = ['Prénom','Nom','E-mail','Téléphone','Statut','Établissement','Sexe','Département','Campus','Chambre','Inscription'];
    const rows = filtered.map(u => [u.prenom,u.nom,u.email,u.tel||'',u.actif?'Actif':'Inactif',u.etablissement||'',u.sexe||'',u.departement||'',u.logeCampus?'Oui':'Non',u.chambre||'',u.createdAt?new Date(u.createdAt).toLocaleDateString('fr-FR'):'']);
    const csv = [h,...rows].map(r=>r.map(c=>`"${c}"`).join(',')).join('\n');
    const blob = new Blob(['\uFEFF'+csv],{type:'text/csv;charset=utf-8;'});
    const a = document.createElement('a'); a.href=URL.createObjectURL(blob);
    a.download=`membres_${new Date().toISOString().split('T')[0]}.csv`; a.click();
  };

  if (loading) return <div style={{padding:48}}><Spinner/></div>;
  if (error) return <div style={{padding:48,display:'flex',alignItems:'center',gap:8,color:'#F87171'}}><XCircle size={18}/>{error}</div>;

  return (
    <div className="admin-membres">
      <div className="admin-page-header">
        <div><h1>Membres</h1><p className="admin-date">{users.length} membre{users.length!==1?'s':''} inscrits</p></div>
        <div className="header-actions">
          <button className="btn btn-outline" onClick={exportCSV}><Download size={16}/> Export CSV</button>
          <button className="btn btn-primary" onClick={openAdd}><UserPlus size={16}/> Ajouter membre</button>
        </div>
      </div>

      <div className="livres-toolbar membres-toolbar">
        <div className="search-bar" style={{maxWidth:380}}><Search size={15}/><input type="text" placeholder="Rechercher un membre..." value={search} onChange={e=>setSearch(e.target.value)}/></div>
        <div className="filter-group">
          <div className="filter-select"><Filter size={13}/>
            <select value={filterStatus} onChange={e=>setFilterStatus(e.target.value)}>
              <option value="tous">Tous statuts</option><option value="actif">Actifs</option><option value="inactif">Inactifs</option>
            </select>
          </div>
          <div className="filter-select">
            <select value={filterEtab} onChange={e=>setFilterEtab(e.target.value)}>
              <option value="tous">Tous établissements</option>
              {['Université','École de formation','Institut','Autre'].map(e=><option key={e} value={e}>{e}</option>)}
            </select>
          </div>
        </div>
        <span className="results-count">{filtered.length} résultat{filtered.length!==1?'s':''}</span>
      </div>

      <div className="dash-card"><div className="table-wrap"><table className="admin-table">
        <thead><tr><th>#</th><th>Nom complet</th><th>E-mail</th><th>Téléphone</th><th>Établissement</th><th>Statut</th><th>Actions</th></tr></thead>
        <tbody>
          {filtered.map((u,i)=>(
            <tr key={u._id} style={{animationDelay:`${i*0.05}s`}}>
              <td style={{color:'var(--txt3)',fontSize:'0.8rem'}}>{i+1}</td>
              <td className="td-name"><div style={{display:'flex',alignItems:'center',gap:10}}><div className="member-avatar-lg">{(u.prenom?.[0]||'').toUpperCase()}{(u.nom?.[0]||'').toUpperCase()}</div>{u.prenom} {u.nom}</div></td>
              <td style={{color:'var(--txt2)'}}>{u.email}</td>
              <td style={{color:'var(--txt2)'}}>{u.telephone||u.tel||'—'}</td>
              <td style={{color:'var(--txt2)',fontSize:'0.8rem'}}>{u.etablissement||'—'}</td>
              <td><span className={`badge ${u.actif?'badge-actif':'badge-rendu'}`}>{u.actif?'Actif':'Inactif'}</span></td>
              <td><div className="row-actions">
                <button className="row-btn rb-blue" onClick={()=>openDetail(u)} title="Fiche"><Eye size={13}/></button>
                <button className="row-btn row-btn-edit" onClick={()=>openEdit(u)}><Pencil size={13}/></button>
                <button className={`row-btn-toggle ${u.actif?'rb-red':'rb-green'}`} onClick={()=>handleToggle(u._id)}>{u.actif?'Désactiver':'Activer'}</button>
                {u.role==='membre'&&<button className="row-btn rb-danger" onClick={()=>openDelete(u)} title="Supprimer"><Trash2 size={13}/></button>}
              </div></td>
            </tr>
          ))}
          {filtered.length===0&&<tr><td colSpan={7} className="td-empty"><User size={20}/><br/>Aucun membre trouvé</td></tr>}
        </tbody>
      </table></div></div>

      {/* Modal Fiche Détaillée */}
      {modal==='detail'&&(
        <div className="modal-overlay" onClick={()=>setModal(null)}><div className="modal-box modal-detail" onClick={e=>e.stopPropagation()}>
          <div className="modal-header"><h2>Fiche membre</h2><button className="modal-close" onClick={()=>setModal(null)}>✕</button></div>
          <div className="modal-body">{detailLoading?<Spinner/>:detailData?(<>
            <div className="detail-profile">
              <div className="detail-avatar">{(current.prenom?.[0]||'').toUpperCase()}{(current.nom?.[0]||'').toUpperCase()}</div>
              <div className="detail-info-main"><h3>{current.prenom} {current.nom}</h3><span className="detail-email">{current.email}</span>
              <span className={`badge ${current.actif?'badge-actif':'badge-rendu'}`}>{current.actif?'Actif':'Inactif'}</span></div>
            </div>
            <div className="detail-grid">
              <div className="detail-field"><span className="detail-label">Téléphone</span><span className="detail-value">{current.tel||current.telephone||'—'}</span></div>
              <div className="detail-field"><span className="detail-label">Sexe</span><span className="detail-value">{current.sexe==='M'?'Masculin':current.sexe==='F'?'Féminin':'—'}</span></div>
              <div className="detail-field"><span className="detail-label">Établissement</span><span className="detail-value">{current.etablissement||'—'}</span></div>
              <div className="detail-field"><span className="detail-label">Département</span><span className="detail-value">{current.departement||'—'}</span></div>
              <div className="detail-field"><span className="detail-label">Campus</span><span className="detail-value">{current.logeCampus?`Oui — ${current.chambre||'N/A'}`:'Non'}</span></div>
              <div className="detail-field"><span className="detail-label">Inscrit le</span><span className="detail-value">{current.createdAt?new Date(current.createdAt).toLocaleDateString('fr-FR'):'—'}</span></div>
            </div>
            <div className="detail-stats-row">
              <div className="detail-stat"><BookOpen size={16}/><span className="detail-stat-val">{detailData.stats.total}</span><span className="detail-stat-label">Total</span></div>
              <div className="detail-stat detail-stat-active"><Clock size={16}/><span className="detail-stat-val">{detailData.stats.actifs}</span><span className="detail-stat-label">Actifs</span></div>
              <div className="detail-stat detail-stat-late"><AlertTriangle size={16}/><span className="detail-stat-val">{detailData.stats.enRetard}</span><span className="detail-stat-label">En retard</span></div>
              <div className="detail-stat detail-stat-done"><CheckCircle size={16}/><span className="detail-stat-val">{detailData.stats.rendus}</span><span className="detail-stat-label">Rendus</span></div>
            </div>
            <h4 className="detail-section-title">Historique des emprunts</h4>
            {detailData.loans.length===0?<div className="detail-empty">Aucun emprunt enregistré</div>:(
              <div className="detail-history-list">{detailData.loans.map(loan=>(
                <div key={loan._id} className={`detail-history-item ${loan.status==='retard'?'history-alert':''}`}>
                  <div className="history-book"><BookOpen size={14}/><span>{loan.book?.title||'Livre inconnu'}</span></div>
                  <div className="history-meta">
                    <span className="history-date">{loan.borrowDate?new Date(loan.borrowDate).toLocaleDateString('fr-FR'):'—'} → {loan.dueDate?new Date(loan.dueDate).toLocaleDateString('fr-FR'):'—'}</span>
                    <span className={`badge ${STATUS_CLASS[loan.status]}`}>{STATUS_LABELS[loan.status]}</span>
                  </div>
                </div>
              ))}</div>
            )}
          </>):null}</div>
        </div></div>
      )}

      {/* Modal Supprimer */}
      {modal==='delete'&&deleteTarget&&(
        <div className="modal-overlay" onClick={()=>setModal(null)}><div className="modal-box modal-small" onClick={e=>e.stopPropagation()}>
          <div className="modal-header modal-header-danger"><h2>Supprimer le membre</h2><button className="modal-close" onClick={()=>setModal(null)}>✕</button></div>
          <div className="modal-body">
            {apiError&&<div className="form-error-banner"><XCircle size={14}/>{apiError}</div>}
            <div className="delete-confirm-content">
              <div className="delete-icon-wrap"><Trash2 size={28}/></div>
              <p>Êtes-vous sûr de vouloir supprimer <strong>{deleteTarget.prenom} {deleteTarget.nom}</strong> ?</p>
              <p className="delete-warning">Cette action est irréversible.</p>
            </div>
          </div>
          <div className="modal-footer"><button className="btn btn-outline" onClick={()=>setModal(null)}>Annuler</button>
            <button className="btn btn-danger" onClick={handleDelete} disabled={saving}>{saving?'Suppression...':'Supprimer'}</button>
          </div>
        </div></div>
      )}

      {/* Modal Ajouter / Modifier */}
      {(modal==='add'||modal==='edit')&&(
        <div className="modal-overlay" onClick={()=>setModal(null)}><div className="modal-box" onClick={e=>e.stopPropagation()}>
          <div className="modal-header"><h2>{modal==='add'?'Ajouter un membre':'Modifier le membre'}</h2><button className="modal-close" onClick={()=>setModal(null)}>✕</button></div>
          <div className="modal-body">
            {apiError&&<div className="form-error-banner"><XCircle size={14}/>{apiError}</div>}
            {admin?.role==='super_admin'&&modal==='add'&&(
              <div className="form-field"><label>Rôle <span className="required">*</span></label>
                <select value={current.role||'membre'} onChange={e=>setCurrent({...current,role:e.target.value,password:''})}>
                  <option value="membre">Membre</option><option value="admin">Administrateur</option>
                </select></div>
            )}
            <div className="form-row">
              <div className="form-field"><label>Prénom <span className="required">*</span></label><input type="text" value={current.prenom||''} onChange={e=>setCurrent({...current,prenom:e.target.value})} placeholder="Moussa"/></div>
              <div className="form-field"><label>Nom <span className="required">*</span></label><input type="text" value={current.nom||''} onChange={e=>setCurrent({...current,nom:e.target.value})} placeholder="Diallo"/></div>
            </div>
            <div className="form-row">
              <div className="form-field"><label>E-mail <span className="required">*</span></label><input type="email" value={current.email||''} onChange={e=>setCurrent({...current,email:e.target.value})} placeholder="moussa@esp.sn"/></div>
              <div className="form-field"><label>Téléphone</label><input type="tel" value={current.tel||current.telephone||''} onChange={e=>setCurrent({...current,tel:e.target.value,telephone:e.target.value})} placeholder="+221 77 000 00 00"/></div>
            </div>
            <div className="form-row">
              <div className="form-field"><label>Sexe</label><select value={current.sexe||''} onChange={e=>setCurrent({...current,sexe:e.target.value})}><option value="">— Non précisé —</option><option value="M">Masculin</option><option value="F">Féminin</option></select></div>
              <div className="form-field"><label>Établissement</label><select value={current.etablissement||''} onChange={e=>setCurrent({...current,etablissement:e.target.value})}><option value="">— Non précisé —</option><option value="Université">Université</option><option value="École de formation">École de formation</option><option value="Institut">Institut</option><option value="Autre">Autre</option></select></div>
            </div>
            <div className="form-field"><label>Département / Filière</label><input type="text" value={current.departement||''} onChange={e=>setCurrent({...current,departement:e.target.value})} placeholder="Ex: Génie Informatique"/></div>
            <div className="form-row" style={{alignItems:'center'}}>
              <label className="checkbox-field"><input type="checkbox" checked={current.logeCampus||false} onChange={e=>setCurrent({...current,logeCampus:e.target.checked})}/>Logé au campus</label>
              {current.logeCampus&&<div className="form-field" style={{flex:1}}><label>N° chambre</label><input type="text" value={current.chambre||''} onChange={e=>setCurrent({...current,chambre:e.target.value})} placeholder="Ex: B-204"/></div>}
            </div>
            {admin?.role==='super_admin'&&modal==='add'&&current.role==='admin'&&(
              <div className="form-field"><label>Mot de passe <span className="required">*</span></label><input type="password" value={current.password||''} onChange={e=>setCurrent({...current,password:e.target.value})} placeholder="Mot de passe du sous-admin"/></div>
            )}
            <label className="checkbox-field"><input type="checkbox" checked={current.actif??true} onChange={e=>setCurrent({...current,actif:e.target.checked})}/>Compte actif</label>
          </div>
          <div className="modal-footer"><button className="btn btn-outline" onClick={()=>setModal(null)}>Annuler</button>
            <button className="btn btn-primary" onClick={save} disabled={saving}>{saving?'Enregistrement...':'Enregistrer'}</button>
          </div>
        </div></div>
      )}
    </div>
  );
}