import React, { useEffect, useState } from 'react';
import axiosClient from '../../api/axiosClient';
import { Card } from '../../components/ui/Card';
import { Table } from '../../components/ui/Table';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Flat, Building } from '../../types';
import { Plus, Edit2, ShieldAlert } from 'lucide-react';

export const FlatsPage: React.FC = () => {
  const [flats, setFlats] = useState<Flat[]>([]);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [currentFlat, setCurrentFlat] = useState<Partial<Flat>>({});

  const fetchFlats = async () => {
    try {
      const flatsRes = await axiosClient.get<Flat[]>('flats');
      setFlats(flatsRes.data);
      const buildingsRes = await axiosClient.get<Building[]>('buildings');
      setBuildings(buildingsRes.data);
    } catch (err) {
      console.error('Failed to load flats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFlats();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (currentFlat.id) {
        await axiosClient.put(`flats/${currentFlat.id}`, currentFlat);
      } else {
        await axiosClient.post('flats', currentFlat);
      }
      setIsOpen(false);
      fetchFlats();
    } catch (err) {
      console.error('Error saving flat:', err);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6 text-left">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Flats & Residents</h2>
          <p className="text-xs text-slate-500 mt-1">Manage buildings, apartment flats, occupancy, and owners.</p>
        </div>
        <Button className="flex items-center gap-1.5" onClick={() => {
          setCurrentFlat({ isOccupied: false });
          setIsOpen(true);
        }}>
          <Plus size={16} /> Add Flat
        </Button>
      </div>

      <Card>
        <Table headers={['Flat Number', 'Building', 'Floor', 'Type', 'Area (SqFt)', 'Status', 'Owner Name', 'Actions']}>
          {flats.map((flat) => (
            <tr key={flat.id}>
              <td className="px-6 py-4 font-semibold text-slate-800">{flat.flatNumber}</td>
              <td className="px-6 py-4">{flat.buildingName || 'N/A'}</td>
              <td className="px-6 py-4">{flat.floor}</td>
              <td className="px-6 py-4">{flat.type}</td>
              <td className="px-6 py-4">{flat.area} sq ft</td>
              <td className="px-6 py-4">
                <StatusBadge status={flat.isOccupied ? 'Paid' : 'Pending'} /> 
                <span className="text-xs font-semibold text-slate-500 ml-1.5">
                  {flat.isOccupied ? 'Occupied' : 'Vacant'}
                </span>
              </td>
              <td className="px-6 py-4 font-medium">{flat.ownerName || 'N/A'}</td>
              <td className="px-6 py-4">
                <button
                  onClick={() => {
                    setCurrentFlat(flat);
                    setIsOpen(true);
                  }}
                  className="p-1 text-slate-400 hover:text-primary-600 transition-colors"
                >
                  <Edit2 size={16} />
                </button>
              </td>
            </tr>
          ))}
        </Table>
      </Card>

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title={currentFlat.id ? 'Edit Flat details' : 'Add New Flat'}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <Input
            label="Flat Number"
            type="text"
            value={currentFlat.flatNumber || ''}
            onChange={(e) => setCurrentFlat({ ...currentFlat, flatNumber: e.target.value })}
            placeholder="e.g. A-101"
            required
          />

          <div className="mb-4 text-left">
            <label className="block text-sm font-medium text-slate-700 mb-1">Building Wing</label>
            <select
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-100"
              value={currentFlat.buildingId || ''}
              onChange={(e) => setCurrentFlat({ ...currentFlat, buildingId: parseInt(e.target.value) })}
              required
            >
              <option value="">Select Wing</option>
              {buildings.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          <Input
            label="Floor"
            type="number"
            value={currentFlat.floor || ''}
            onChange={(e) => setCurrentFlat({ ...currentFlat, floor: parseInt(e.target.value) })}
            placeholder="e.g. 1"
            required
          />

          <Input
            label="Flat Type"
            type="text"
            value={currentFlat.type || ''}
            onChange={(e) => setCurrentFlat({ ...currentFlat, type: e.target.value })}
            placeholder="e.g. 2BHK"
            required
          />

          <Input
            label="Area (Sq Ft)"
            type="number"
            value={currentFlat.area || ''}
            onChange={(e) => setCurrentFlat({ ...currentFlat, area: parseInt(e.target.value) })}
            placeholder="e.g. 950"
            required
          />

          <div className="flex items-center gap-2 pt-2 text-left">
            <input
              type="checkbox"
              id="isOccupied"
              checked={currentFlat.isOccupied || false}
              onChange={(e) => setCurrentFlat({ ...currentFlat, isOccupied: e.target.checked })}
              className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
            />
            <label htmlFor="isOccupied" className="text-sm font-medium text-slate-700">
              Is Occupied
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" type="button" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Save
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
