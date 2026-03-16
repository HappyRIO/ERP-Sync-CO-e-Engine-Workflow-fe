import { useState, useMemo } from "react";
import { Upload, RefreshCw, Filter, Search, Download, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useInventory, useUploadInventory, useSyncInventory } from "@/hooks/useInventory";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { InventoryItem } from "@/services/inventory.service";

const Inventory = () => {
  const { user } = useAuth();
  const { data: inventory = [], isLoading } = useInventory();
  const uploadInventory = useUploadInventory();
  const syncInventory = useSyncInventory();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [deviceTypeFilter, setDeviceTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [conditionCodeFilter, setConditionCodeFilter] = useState<string>("all");
  const [showUpload, setShowUpload] = useState(false);
  const [csvData, setCsvData] = useState("");

  const filteredInventory = useMemo(() => {
    return inventory.filter((item) => {
      const matchesSearch = 
        item.make.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.serialNumber.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesDeviceType = deviceTypeFilter === "all" || item.deviceType === deviceTypeFilter;
      const matchesStatus = statusFilter === "all" || item.status === statusFilter;
      const matchesConditionCode = conditionCodeFilter === "all" || item.conditionCode === conditionCodeFilter;

      return matchesSearch && matchesDeviceType && matchesStatus && matchesConditionCode;
    });
  }, [inventory, searchTerm, deviceTypeFilter, statusFilter, conditionCodeFilter]);

  const handleCSVUpload = () => {
    if (!csvData.trim()) {
      toast.error("Please paste CSV data");
      return;
    }

    const lines = csvData.trim().split('\n');
    const headers = lines[0].toLowerCase().split(',').map(h => h.trim());
    
    // Find column indices
    const makeIdx = headers.findIndex(h => h.includes('make'));
    const modelIdx = headers.findIndex(h => h.includes('model'));
    const serialIdx = headers.findIndex(h => h.includes('serial'));
    const imeiIdx = headers.findIndex(h => h.includes('imei'));
    const deviceTypeIdx = headers.findIndex(h => h.includes('device') || h.includes('type'));
    const conditionIdx = headers.findIndex(h => h.includes('condition') || h.includes('code'));

    if (makeIdx === -1 || modelIdx === -1 || serialIdx === -1) {
      toast.error("CSV must contain columns: make, model, serialNumber");
      return;
    }

    const items = lines.slice(1).map(line => {
      const values = line.split(',').map(v => v.trim());
      return {
        deviceType: deviceTypeIdx >= 0 ? values[deviceTypeIdx] : 'laptop',
        make: values[makeIdx],
        model: values[modelIdx],
        serialNumber: values[serialIdx],
        imei: imeiIdx >= 0 ? values[imeiIdx] : undefined,
        conditionCode: conditionIdx >= 0 ? values[conditionIdx] : 'A',
      };
    }).filter(item => item.make && item.model && item.serialNumber);

    uploadInventory.mutate({ items });
    setCsvData("");
    setShowUpload(false);
  };

  const handleSync = () => {
    syncInventory.mutate();
  };

  const statusColors: Record<string, string> = {
    available: "bg-green-500/10 text-green-500",
    allocated: "bg-blue-500/10 text-blue-500",
    in_transit: "bg-yellow-500/10 text-yellow-500",
    delivered: "bg-purple-500/10 text-purple-500",
    collected: "bg-orange-500/10 text-orange-500",
    warehouse: "bg-gray-500/10 text-gray-500",
  };

  const uniqueDeviceTypes = useMemo(() => {
    return Array.from(new Set(inventory.map(item => item.deviceType)));
  }, [inventory]);

  const uniqueConditionCodes = useMemo(() => {
    return Array.from(new Set(inventory.map(item => item.conditionCode))).sort();
  }, [inventory]);

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Inventory Management</h1>
          <p className="text-muted-foreground">
            Manage your laptop and mobile phone inventory
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleSync} disabled={syncInventory.isPending}>
            <RefreshCw className={`mr-2 h-4 w-4 ${syncInventory.isPending ? 'animate-spin' : ''}`} />
            Sync with ReuseOS
          </Button>
          <Button onClick={() => setShowUpload(!showUpload)}>
            <Upload className="mr-2 h-4 w-4" />
            Upload Inventory
          </Button>
        </div>
      </div>

      {showUpload && (
        <Card>
          <CardHeader>
            <CardTitle>Upload Inventory (CSV)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>CSV Format: make, model, serialNumber, deviceType, imei (optional), conditionCode</Label>
              <textarea
                className="w-full h-32 p-2 border rounded-md font-mono text-sm"
                value={csvData}
                onChange={(e) => setCsvData(e.target.value)}
                placeholder="make,model,serialNumber,deviceType,imei,conditionCode&#10;Dell,Latitude 7420,ABC123,laptop,123456789,IBMA&#10;Apple,MacBook Pro,DEF456,laptop,,IBMB"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleCSVUpload} disabled={uploadInventory.isPending}>
                Upload
              </Button>
              <Button variant="outline" onClick={() => setShowUpload(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Inventory List</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by make, model, or serial..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <Select value={deviceTypeFilter} onValueChange={setDeviceTypeFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Device Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {uniqueDeviceTypes.map(type => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="available">Available</SelectItem>
                <SelectItem value="allocated">Allocated</SelectItem>
                <SelectItem value="in_transit">In Transit</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="collected">Collected</SelectItem>
                <SelectItem value="warehouse">Warehouse</SelectItem>
              </SelectContent>
            </Select>
            <Select value={conditionCodeFilter} onValueChange={setConditionCodeFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Condition" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Conditions</SelectItem>
                {uniqueConditionCodes.map(code => (
                  <SelectItem key={code} value={code}>{code}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="text-center py-8">Loading...</div>
          ) : filteredInventory.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No inventory items found
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Device Type</TableHead>
                  <TableHead>Make</TableHead>
                  <TableHead>Model</TableHead>
                  <TableHead>Serial Number</TableHead>
                  <TableHead>IMEI</TableHead>
                  <TableHead>Condition Code</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInventory.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.deviceType}</TableCell>
                    <TableCell>{item.make}</TableCell>
                    <TableCell>{item.model}</TableCell>
                    <TableCell className="font-mono">{item.serialNumber}</TableCell>
                    <TableCell className="font-mono">{item.imei || '-'}</TableCell>
                    <TableCell>{item.conditionCode}</TableCell>
                    <TableCell>
                      <Badge className={statusColors[item.status] || ''}>
                        {item.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Inventory;
