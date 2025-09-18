import React, { useState, useEffect } from "react";
import "./App.css";
import { BrowserRouter, Routes, Route, Navigate, useParams } from "react-router-dom";
import axios from "axios";
import { Toaster } from "./components/ui/sonner";
import { toast } from "sonner";

// UI Components
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { Label } from "./components/ui/label";
import { Card, CardHeader, CardTitle, CardContent } from "./components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./components/ui/table";
import { Badge } from "./components/ui/badge";
import { Alert, AlertDescription } from "./components/ui/alert";

// Icons
import { 
  LogIn, 
  Users, 
  Calendar, 
  UserPlus, 
  QrCode, 
  Download, 
  Plus, 
  Edit, 
  Trash2, 
  Eye,
  LogOut,
  Camera,
  Smartphone
} from "lucide-react";

// Custom Components
import QRScanner from './components/QRScanner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Auth Context
const AuthContext = React.createContext();

function AuthProvider({ children }) {
  const [admin, setAdmin] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
  }, [token]);

  const login = (adminData, authToken) => {
    setAdmin(adminData);
    setToken(authToken);
    localStorage.setItem('token', authToken);
    axios.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;
  };

  const logout = () => {
    setAdmin(null);
    setToken(null);
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
  };

  return (
    <AuthContext.Provider value={{ admin, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

function useAuth() {
  return React.useContext(AuthContext);
}

// Login Component
function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post(`${API}/auth/login`, {
        username,
        password
      });

      login(response.data.admin, response.data.access_token);
      toast.success('Login berhasil!');
    } catch (error) {
      toast.error('Login gagal. Periksa username dan password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-emerald-800">
            QR Attendance RH
          </CardTitle>
          <p className="text-gray-600">Admin Panel - Kajian RH</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Masukkan username"
                required
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan password"
                required
                className="mt-1"
              />
            </div>
            <Button 
              type="submit" 
              className="w-full bg-emerald-600 hover:bg-emerald-700"
              disabled={loading}
            >
              <LogIn className="w-4 h-4 mr-2" />
              {loading ? 'Masuk...' : 'Masuk'}
            </Button>
          </form>
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm font-medium text-gray-700 mb-2">Default Admin:</p>
            <p className="text-xs text-gray-600">adminrh / cintaquran</p>
            <p className="text-xs text-gray-600">pesmarh / rhmantab</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Admin Dashboard
function AdminDashboard() {
  const { admin, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('jamaah');

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div>
              <h1 className="text-xl font-bold text-emerald-800">QR Attendance RH</h1>
              <p className="text-sm text-gray-600">Admin Panel</p>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">Hallo, {admin?.username}</span>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={logout}
                className="text-red-600 border-red-200 hover:bg-red-50"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Keluar
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-4 w-full max-w-md">
            <TabsTrigger value="jamaah" className="flex items-center space-x-2">
              <Users className="w-4 h-4" />
              <span>Jamaah</span>
            </TabsTrigger>
            <TabsTrigger value="kajian" className="flex items-center space-x-2">
              <Calendar className="w-4 h-4" />
              <span>Kajian</span>
            </TabsTrigger>
            <TabsTrigger value="admin" className="flex items-center space-x-2">
              <UserPlus className="w-4 h-4" />
              <span>Admin</span>
            </TabsTrigger>
            <TabsTrigger value="laporan" className="flex items-center space-x-2">
              <Download className="w-4 h-4" />
              <span>Laporan</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="jamaah">
            <JamaahManagement />
          </TabsContent>
          
          <TabsContent value="kajian">
            <KajianManagement />
          </TabsContent>
          
          <TabsContent value="admin">
            <AdminManagement />
          </TabsContent>
          
          <TabsContent value="laporan">
            <LaporanManagement />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

// Jamaah Management Component
function JamaahManagement() {
  const [jamaah, setJamaah] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [editingJamaah, setEditingJamaah] = useState(null);
  const [formData, setFormData] = useState({ nama: '', hp: '' });

  const fetchJamaah = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API}/jamaah`);
      setJamaah(response.data);
    } catch (error) {
      toast.error('Gagal memuat data jamaah');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJamaah();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (editingJamaah) {
        await axios.put(`${API}/jamaah/${editingJamaah.id}`, formData);
        toast.success('Jamaah berhasil diperbarui');
      } else {
        await axios.post(`${API}/jamaah`, formData);
        toast.success('Jamaah berhasil ditambahkan');
      }
      
      setShowDialog(false);
      setFormData({ nama: '', hp: '' });
      setEditingJamaah(null);
      fetchJamaah();
    } catch (error) {
      toast.error('Gagal menyimpan data jamaah');
    }
  };

  const handleEdit = (item) => {
    setEditingJamaah(item);
    setFormData({ nama: item.nama, hp: item.hp || '' });
    setShowDialog(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Yakin ingin menghapus jamaah ini?')) {
      try {
        await axios.delete(`${API}/jamaah/${id}`);
        toast.success('Jamaah berhasil dihapus');
        fetchJamaah();
      } catch (error) {
        toast.error('Gagal menghapus jamaah');
      }
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Manajemen Jamaah</CardTitle>
          <Dialog open={showDialog} onOpenChange={setShowDialog}>
            <DialogTrigger asChild>
              <Button className="bg-emerald-600 hover:bg-emerald-700">
                <Plus className="w-4 h-4 mr-2" />
                Tambah Jamaah
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingJamaah ? 'Edit Jamaah' : 'Tambah Jamaah'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="nama">Nama</Label>
                  <Input
                    id="nama"
                    type="text"
                    value={formData.nama}
                    onChange={(e) => setFormData({...formData, nama: e.target.value})}
                    placeholder="Nama jamaah"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="hp">No. HP</Label>
                  <Input
                    id="hp"
                    type="text"
                    value={formData.hp}
                    onChange={(e) => setFormData({...formData, hp: e.target.value})}
                    placeholder="Nomor HP (opsional)"
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>
                    Batal
                  </Button>
                  <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700">
                    {editingJamaah ? 'Update' : 'Simpan'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8">Memuat data...</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama</TableHead>
                <TableHead>No. HP</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {jamaah.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.nama}</TableCell>
                  <TableCell>{item.hp || '-'}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleEdit(item)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="text-red-600 border-red-200 hover:bg-red-50"
                        onClick={() => handleDelete(item.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

// Kajian Management Component
function KajianManagement() {
  const [kajian, setKajian] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [editingKajian, setEditingKajian] = useState(null);
  const [formData, setFormData] = useState({ 
    judul: '', 
    tanggal: '', 
    jam_mulai: '', 
    jam_selesai: '' 
  });

  const fetchKajian = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API}/kajian`);
      setKajian(response.data);
    } catch (error) {
      toast.error('Gagal memuat data kajian');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKajian();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (editingKajian) {
        await axios.put(`${API}/kajian/${editingKajian.id}`, formData);
        toast.success('Kajian berhasil diperbarui');
      } else {
        await axios.post(`${API}/kajian`, formData);
        toast.success('Kajian berhasil ditambahkan');
      }
      
      setShowDialog(false);
      setFormData({ judul: '', tanggal: '', jam_mulai: '', jam_selesai: '' });
      setEditingKajian(null);
      fetchKajian();
    } catch (error) {
      toast.error('Gagal menyimpan data kajian');
    }
  };

  const handleEdit = (item) => {
    setEditingKajian(item);
    setFormData({
      judul: item.judul,
      tanggal: item.tanggal,
      jam_mulai: item.jam_mulai,
      jam_selesai: item.jam_selesai
    });
    setShowDialog(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Yakin ingin menghapus kajian ini?')) {
      try {
        await axios.delete(`${API}/kajian/${id}`);
        toast.success('Kajian berhasil dihapus');
        fetchKajian();
      } catch (error) {
        toast.error('Gagal menghapus kajian');
      }
    }
  };

  const downloadQR = async (kajianId, judul) => {
    try {
      const response = await axios.get(`${API}/kajian/${kajianId}/qr`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `QR_${judul}.png`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast.success('QR Code berhasil diunduh');
    } catch (error) {
      toast.error('Gagal mengunduh QR Code');
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Manajemen Kajian</CardTitle>
          <Dialog open={showDialog} onOpenChange={setShowDialog}>
            <DialogTrigger asChild>
              <Button className="bg-emerald-600 hover:bg-emerald-700">
                <Plus className="w-4 h-4 mr-2" />
                Tambah Kajian
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingKajian ? 'Edit Kajian' : 'Tambah Kajian'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="judul">Judul Kajian</Label>
                  <Input
                    id="judul"
                    type="text"
                    value={formData.judul}
                    onChange={(e) => setFormData({...formData, judul: e.target.value})}
                    placeholder="Judul kajian"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="tanggal">Tanggal</Label>
                  <Input
                    id="tanggal"
                    type="date"
                    value={formData.tanggal}
                    onChange={(e) => setFormData({...formData, tanggal: e.target.value})}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="jam_mulai">Jam Mulai</Label>
                    <Input
                      id="jam_mulai"
                      type="time"
                      value={formData.jam_mulai}
                      onChange={(e) => setFormData({...formData, jam_mulai: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="jam_selesai">Jam Selesai</Label>
                    <Input
                      id="jam_selesai"
                      type="time"
                      value={formData.jam_selesai}
                      onChange={(e) => setFormData({...formData, jam_selesai: e.target.value})}
                      required
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>
                    Batal
                  </Button>
                  <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700">
                    {editingKajian ? 'Update' : 'Simpan'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8">Memuat data...</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Judul</TableHead>
                <TableHead>Tanggal</TableHead>
                <TableHead>Waktu</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {kajian.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.judul}</TableCell>
                  <TableCell>{new Date(item.tanggal).toLocaleDateString('id-ID')}</TableCell>
                  <TableCell>{item.jam_mulai} - {item.jam_selesai}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => downloadQR(item.id, item.judul)}
                        title="Download QR Code"
                      >
                        <QrCode className="w-4 h-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleEdit(item)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="text-red-600 border-red-200 hover:bg-red-50"
                        onClick={() => handleDelete(item.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

// Admin Management Component  
function AdminManagement() {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState(null);
  const [formData, setFormData] = useState({ username: '', password: '' });

  const fetchAdmins = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API}/admin`);
      setAdmins(response.data);
    } catch (error) {
      toast.error('Gagal memuat data admin');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (editingAdmin) {
        await axios.put(`${API}/admin/${editingAdmin.id}`, formData);
        toast.success('Admin berhasil diperbarui');
      } else {
        await axios.post(`${API}/admin`, formData);
        toast.success('Admin berhasil ditambahkan');
      }
      
      setShowDialog(false);
      setFormData({ username: '', password: '' });
      setEditingAdmin(null);
      fetchAdmins();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Gagal menyimpan data admin');
    }
  };

  const handleEdit = (item) => {
    setEditingAdmin(item);
    setFormData({ username: item.username, password: '' });
    setShowDialog(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Yakin ingin menghapus admin ini?')) {
      try {
        await axios.delete(`${API}/admin/${id}`);
        toast.success('Admin berhasil dihapus');
        fetchAdmins();
      } catch (error) {
        toast.error('Gagal menghapus admin');
      }
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Manajemen Admin</CardTitle>
          <Dialog open={showDialog} onOpenChange={setShowDialog}>
            <DialogTrigger asChild>
              <Button className="bg-emerald-600 hover:bg-emerald-700">
                <Plus className="w-4 h-4 mr-2" />
                Tambah Admin
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingAdmin ? 'Edit Admin' : 'Tambah Admin'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({...formData, username: e.target.value})}
                    placeholder="Username admin"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    placeholder={editingAdmin ? "Kosongkan jika tidak ingin mengubah" : "Password admin"}
                    required={!editingAdmin}
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>
                    Batal
                  </Button>
                  <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700">
                    {editingAdmin ? 'Update' : 'Simpan'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8">Memuat data...</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Username</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {admins.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.username}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleEdit(item)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="text-red-600 border-red-200 hover:bg-red-50"
                        onClick={() => handleDelete(item.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

// Laporan Management Component
function LaporanManagement() {
  const [kajian, setKajian] = useState([]);
  const [selectedKajian, setSelectedKajian] = useState(null);
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchKajian = async () => {
    try {
      const response = await axios.get(`${API}/kajian`);
      setKajian(response.data);
    } catch (error) {
      toast.error('Gagal memuat data kajian');
    }
  };

  useEffect(() => {
    fetchKajian();
  }, []);

  const fetchReport = async (kajianId) => {
    setLoading(true);
    try {
      const response = await axios.get(`${API}/laporan/${kajianId}`);
      setReportData(response.data);
      setSelectedKajian(kajian.find(k => k.id === kajianId));
    } catch (error) {
      toast.error('Gagal memuat laporan');
      setReportData(null);
    } finally {
      setLoading(false);
    }
  };

  const exportCSV = async (kajianId) => {
    try {
      const response = await axios.get(`${API}/laporan/${kajianId}/export`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `laporan_presensi_${selectedKajian?.judul || kajianId}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast.success('Laporan berhasil diunduh');
    } catch (error) {
      toast.error('Gagal mengunduh laporan');
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Laporan Presensi</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {kajian.map((item) => (
              <Card key={item.id} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <h3 className="font-semibold text-lg mb-2">{item.judul}</h3>
                  <p className="text-sm text-gray-600 mb-1">
                    {new Date(item.tanggal).toLocaleDateString('id-ID')}
                  </p>
                  <p className="text-sm text-gray-600 mb-4">
                    {item.jam_mulai} - {item.jam_selesai}
                  </p>
                  <div className="flex space-x-2">
                    <Button 
                      size="sm" 
                      onClick={() => fetchReport(item.id)}
                      className="bg-emerald-600 hover:bg-emerald-700"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Lihat
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => exportCSV(item.id)}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      CSV
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {loading && (
        <Card>
          <CardContent className="text-center py-8">
            Memuat laporan...
          </CardContent>
        </Card>
      )}

      {reportData && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle>Laporan: {selectedKajian?.judul}</CardTitle>
                <p className="text-sm text-gray-600 mt-1">
                  {new Date(selectedKajian?.tanggal).toLocaleDateString('id-ID')} | 
                  {selectedKajian?.jam_mulai} - {selectedKajian?.jam_selesai}
                </p>
              </div>
              <Badge variant="secondary" className="text-lg px-3 py-1">
                {reportData.total_hadir} Hadir
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {reportData.detail_kehadiran.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>No</TableHead>
                    <TableHead>Nama</TableHead>
                    <TableHead>No. HP</TableHead>
                    <TableHead>Waktu Presensi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reportData.detail_kehadiran.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell className="font-medium">{item.nama}</TableCell>
                      <TableCell>{item.hp || '-'}</TableCell>
                      <TableCell>
                        {new Date(item.waktu_presensi).toLocaleString('id-ID')}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-gray-500">
                Belum ada presensi untuk kajian ini
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Jamaah Home Page with QR Scanner
function JamaahHome() {
  const navigate = useNavigate();

  const handleQRScan = (kajianId) => {
    navigate(`/presensi/${kajianId}`);
  };

  const handleManualInput = () => {
    const kajianId = prompt('Masukkan kode kajian:');
    if (kajianId) {
      navigate(`/presensi/${kajianId}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100 flex items-center justify-center p-4">
      <div className="space-y-6 w-full max-w-md">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-emerald-800 mb-2">QR Attendance RH</h1>
          <p className="text-gray-600">Presensi Kajian</p>
        </div>

        <QRScanner 
          onScan={handleQRScan}
          onError={(error) => toast.error(error)}
        />

        <div className="text-center">
          <p className="text-sm text-gray-600 mb-4">atau</p>
          <Button 
            variant="outline" 
            onClick={handleManualInput}
            className="w-full"
          >
            <Smartphone className="w-4 h-4 mr-2" />
            Input Manual Kode Kajian
          </Button>
        </div>
      </div>
    </div>
  );
}
function PresensiPage() {
  const { kajian_id } = useParams();
  const [kajian, setKajian] = useState(null);
  const [jamaah, setJamaah] = useState([]);
  const [selectedJamaah, setSelectedJamaah] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchKajian = async () => {
    try {
      const response = await axios.get(`${API}/kajian/${kajian_id}/public`);
      setKajian(response.data);
    } catch (error) {
      toast.error('Kajian tidak ditemukan');
    }
  };

  const fetchJamaah = async () => {
    try {
      const response = await axios.get(`${API}/jamaah`);
      setJamaah(response.data);
    } catch (error) {
      console.error('Failed to fetch jamaah');
    }
  };

  useEffect(() => {
    if (kajian_id) {
      fetchKajian();
      fetchJamaah();
    }
  }, [kajian_id]);

  const handlePresensi = async () => {
    if (!selectedJamaah) {
      toast.error('Pilih nama jamaah terlebih dahulu');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API}/presensi`, {
        id_jamaah: selectedJamaah,
        id_kajian: kajian_id
      });
      
      setResult(response.data);
    } catch (error) {
      toast.error('Gagal melakukan presensi');
    } finally {
      setLoading(false);
    }
  };

  if (!kajian) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100 flex items-center justify-center">
        <div className="text-center">Memuat data kajian...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-emerald-800">
            Presensi Kajian
          </CardTitle>
          <div className="space-y-1">
            <p className="font-semibold">{kajian.judul}</p>
            <p className="text-sm text-gray-600">
              {new Date(kajian.tanggal).toLocaleDateString('id-ID')}
            </p>
            <p className="text-sm text-gray-600">
              {kajian.jam_mulai} - {kajian.jam_selesai}
            </p>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {result ? (
            <Alert className={result.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
              <AlertDescription className="text-center font-medium">
                {result.message}
              </AlertDescription>
            </Alert>
          ) : (
            <>
              <div>
                <Label htmlFor="jamaah">Pilih Nama Anda</Label>
                <select
                  id="jamaah"
                  value={selectedJamaah}
                  onChange={(e) => setSelectedJamaah(e.target.value)}
                  className="w-full mt-1 p-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
                  required
                >
                  <option value="">-- Pilih Nama --</option>
                  {jamaah.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.nama}
                    </option>
                  ))}
                </select>
              </div>
              
              <Button 
                onClick={handlePresensi}
                disabled={loading || !selectedJamaah}
                className="w-full bg-emerald-600 hover:bg-emerald-700"
              >
                <Smartphone className="w-4 h-4 mr-2" />
                {loading ? 'Memproses...' : 'Konfirmasi Presensi'}
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Protected Route Component
function ProtectedRoute({ children }) {
  const { token } = useAuth();
  return token ? children : <Navigate to="/login" replace />;
}

// Main App Component
function App() {
  return (
    <AuthProvider>
      <div className="App">
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/presensi/:kajian_id" element={<PresensiPage />} />
            <Route path="/" element={
              <ProtectedRoute>
                <AdminDashboard />
              </ProtectedRoute>
            } />
          </Routes>
        </BrowserRouter>
        <Toaster position="top-right" />
      </div>
    </AuthProvider>
  );
}

export default App;