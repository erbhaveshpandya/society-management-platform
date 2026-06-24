import React, { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import axiosClient from '../../api/axiosClient';
import { Card } from '../../components/ui/Card';
import { Table } from '../../components/ui/Table';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { Flat, Vehicle } from '../../types';
import { Plus, Trash2, Shield, Info, Eye, Car } from 'lucide-react';

export const VehiclesPage: React.FC = () => {
  const { user } = useAuth();
  const [flats, setFlats] = useState<Flat[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  
  const [formData, setFormData] = useState({
    vehicleNumber: '',
    type: 'Car',
    make: '',
    model: ''
  });

  const fetchData = async () => {
    try {
      const res = await axiosClient.get<Flat[]>('flats');
      setFlats(res.data);
    } catch (err) {
      console.error('Failed to load flats & vehicles info:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const myVehicles: any[] = [];
  flats.forEach((f: any) => {
    const isAssociated = f.ownerId === user?.id || (f.residents && f.residents.some((r: any) => r.userId === user?.id));
    if (isAssociated && f.residents) {
      f.residents.forEach((r: any) => {
        if (r.userId === user?.id && r.vehicles) {
          r.vehicles.forEach((v: any) => {
            myVehicles.push({
              id: v.id,
              vehicleNumber: v.vehicleNumber,
              type: v.type,
              make: v.make,
              model: v.model,
              flatNumber: f.flatNumber,
              buildingName: f.buildingName
            });
          });
        }
      });
    }
  });

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axiosClient.post('flats/vehicles', {
        vehicleNumber: formData.vehicleNumber.toUpperCase(),
        type: formData.type,
        make: formData.make,
        model: formData.model
      });
      setIsOpen(false);
      setFormData({
        vehicleNumber: '',
        type: 'Car',
        make: '',
        model: ''
      });
      fetchData();
    } catch (err) {
      console.error('Failed to register vehicle:', err);
    }
  };

  const handleDelete = async (id: number) => {
    setDeletingId(id);
    try {
      await axiosClient.delete(`flats/vehicles/${id}`);
      fetchData();
    } catch (err) {
      console.error('Failed to delete vehicle:', err);
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6 text-left max-w-4xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-800">My Registered Vehicles</h2>
          <p className="text-xs text-slate-500 mt-1">
            Register your cars and two-wheelers for automated gate security logs and parking authorizations.
          </p>
        </div>
        <Button className="flex items-center gap-1.5" onClick={() => setIsOpen(true)}>
          <Plus size={16} /> Register Vehicle
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        {/* Left Info Panel */}
        <Card className="p-5 md:col-span-1 bg-slate-50/50 border-slate-100 space-y-4">
          <h3 className="text-xs font-bold text-slate-700 uppercase flex items-center gap-1.5 border-b border-slate-100 pb-2">
            <Shield size={14} className="text-primary-600" /> Security Standards
          </h3>
          <div className="space-y-3 text-[11px] font-medium text-slate-500 leading-relaxed">
            <div className="flex gap-2">
              <Info size={14} className="text-slate-400 shrink-0 mt-0.5" />
              <p>Registered vehicles are verified by security guards at the entry/exit points.</p>
            </div>
            <div className="flex gap-2">
              <Info size={14} className="text-slate-400 shrink-0 mt-0.5" />
              <p>Ensure number plate formatting matches standard RTO syntax (e.g. MH12AB1234).</p>
            </div>
          </div>
        </Card>

        {/* Vehicle list */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            {myVehicles.length > 0 ? (
              <Table headers={['Vehicle Type', 'Number Plate', 'Brand Make / Model', 'Assigned Flat', 'Actions']}>
                {myVehicles.map((v) => (
                  <tr key={v.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-800 flex items-center gap-2">
                      <Car size={16} className="text-slate-400" />
                      {v.type}
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-0.5 bg-slate-100 border border-slate-200 rounded text-xs font-mono font-bold text-slate-700">
                        {v.vehicleNumber}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-600">
                      {v.make} {v.model}
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-500">
                      Flat {v.flatNumber}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleDelete(v.id)}
                        disabled={deletingId === v.id}
                        className="text-red-500 hover:text-red-700 transition-colors p-1.5 hover:bg-red-50 rounded-lg border border-transparent hover:border-red-100"
                        title="Remove vehicle registration"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </Table>
            ) : (
              <div className="py-16 text-center">
                <Car className="mx-auto text-slate-300 mb-3" size={36} />
                <h4 className="text-sm font-bold text-slate-700">No vehicles registered yet</h4>
                <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                  Click the button above to register your first vehicle to enable parking check.
                </p>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Register Vehicle Modal */}
      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Register a Vehicle">
        <form onSubmit={handleRegister} className="space-y-4 text-left">
          <Input
            label="Vehicle Number / Plate"
            placeholder="e.g. MH12AB1234"
            value={formData.vehicleNumber}
            onChange={(e) => setFormData({ ...formData, vehicleNumber: e.target.value })}
            required
          />

          <div className="text-left mb-3">
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Vehicle Type</label>
            <select
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-100"
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              required
            >
              <option value="Car">Car / SUV</option>
              <option value="Bike">Bike / Motorcycle</option>
              <option value="Scooter">Scooter / Moped</option>
              <option value="Other">Other Type</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Brand Make"
              placeholder="e.g. Honda, Hyundai"
              value={formData.make}
              onChange={(e) => setFormData({ ...formData, make: e.target.value })}
              required
            />
            <Input
              label="Model Name"
              placeholder="e.g. Civic, Creta"
              value={formData.model}
              onChange={(e) => setFormData({ ...formData, model: e.target.value })}
              required
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button variant="outline" type="button" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Register Vehicle
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
