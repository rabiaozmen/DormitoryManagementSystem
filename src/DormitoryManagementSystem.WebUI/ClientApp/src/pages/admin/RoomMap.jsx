import { useEffect, useMemo, useState } from "react";
import { Bed, ChevronDown, LayoutGrid, Users } from "lucide-react";
import { getRooms } from "../../api/auth";
import { EmptyState } from "../../components/ui/EmptyState";

export default function RoomMap() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFloor, setSelectedFloor] = useState("1");
  const [selectedCapacityFilter, setSelectedCapacityFilter] = useState("all");

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getRooms();
        setRooms(data);
      } catch (error) {
        console.error("Failed to load rooms", error);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const summary = useMemo(() => {
    const totals = rooms.reduce(
      (acc, room) => {
        acc.capacity += room.capacity;
        acc.occupancy += room.occupancy;
        return acc;
      },
      { capacity: 0, occupancy: 0 }
    );

    const occupancyRate = totals.capacity === 0
      ? 0
      : Math.round((totals.occupancy / totals.capacity) * 100);

    return {
      ...totals,
      occupancyRate
    };
  }, [rooms]);

  const floorStructure = useMemo(() => {
    const parseFloor = (roomNumber) => {
      const normalized = (roomNumber ?? "").trim().toUpperCase();

      const prefixMatch = normalized.match(/^([A-Z])[-\s]?(.+)$/);
      if (prefixMatch) {
        const floorNo = prefixMatch[1].charCodeAt(0) - 64;
        if (floorNo >= 1 && floorNo <= 4) {
          return { key: `${floorNo}`, label: `${floorNo}. Kat`, order: floorNo };
        }
      }

      const parts = normalized.split("-");
      const numeric = parts.length > 1 ? parseInt(parts[1], 10) : NaN;

      if (!Number.isNaN(numeric) && numeric >= 100) {
        const floorNo = Math.floor(numeric / 100);
        if (floorNo >= 1 && floorNo <= 4) {
          return { key: `${floorNo}`, label: `${floorNo}. Kat`, order: floorNo };
        }
      }

      return { key: "other", label: "Diğer", order: 99 };
    };

    const floorMap = rooms.reduce((acc, room) => {
      const floor = parseFloor(room.roomNumber);

      if (!acc[floor.key]) {
        acc[floor.key] = {
          key: floor.key,
          label: floor.label,
          order: floor.order,
          rooms: []
        };
      }

      acc[floor.key].rooms.push(room);
      return acc;
    }, {});

    const expectedFloors = [1, 2, 3, 4].map((floorNo) => ({
      key: `${floorNo}`,
      label: `${floorNo}. Kat`,
      order: floorNo,
      rooms: []
    }));

    expectedFloors.forEach((floor) => {
      if (floorMap[floor.key]) {
        floor.rooms = floorMap[floor.key].rooms.sort((left, right) => left.roomNumber.localeCompare(right.roomNumber));
      }
    });

    return expectedFloors;
  }, [rooms]);

  useEffect(() => {
    if (!floorStructure.length) return;
    if (!selectedFloor || !floorStructure.some((floor) => floor.key === selectedFloor)) {
      const firstAvailableFloor = floorStructure.find((floor) => floor.rooms.length > 0) || floorStructure[0];
      setSelectedFloor(firstAvailableFloor.key);
    }
  }, [floorStructure, selectedFloor]);

  const currentFloor = useMemo(
    () => floorStructure.find((floor) => floor.key === selectedFloor) || null,
    [floorStructure, selectedFloor]
  );

  const floorRooms = currentFloor?.rooms ?? [];

  const floorStats = useMemo(() => {
    const floorCapacity = floorRooms.reduce((sum, room) => sum + room.capacity, 0);
    const floorOccupancy = floorRooms.reduce((sum, room) => sum + room.occupancy, 0);
    const floorRate = floorCapacity === 0 ? 0 : Math.round((floorOccupancy / floorCapacity) * 100);

    const typeCounts = floorRooms.reduce(
      (acc, room) => {
        const key = room.capacity <= 4 ? String(room.capacity) : "other";
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      },
      { all: floorRooms.length }
    );

    const filteredRooms = floorRooms.filter((room) => {
      if (selectedCapacityFilter === "all") return true;
      return String(room.capacity) === selectedCapacityFilter;
    });

    return { floorCapacity, floorOccupancy, floorRate, typeCounts, filteredRooms };
  }, [floorRooms, selectedCapacityFilter]);

  useEffect(() => {
    setSelectedCapacityFilter("all");
  }, [selectedFloor]);

  const roomStatusLabel = (room) => {
    if (room.occupancy === 0) return "Empty";
    if (room.occupancy >= room.capacity) return "Full";
    return "Partial";
  };

  const roomTypeLabel = (capacity) => {
    if (capacity === 1) return "Single";
    if (capacity === 2) return "Double";
    if (capacity === 3) return "Triple";
    if (capacity === 4) return "Quad";
    return `${capacity}-Person`;
  };

  const getGenderPolicyDisplay = (room) => {
    const buildingName = String(room.buildingName || "").toLowerCase();

    if (buildingName.includes("block a") || buildingName.includes("block b")) {
      return {
        label: "Male",
        className: "bg-sky-100 text-sky-700 border-sky-200"
      };
    }

    if (buildingName.includes("block c") || buildingName.includes("block d")) {
      return {
        label: "Female",
        className: "bg-pink-100 text-pink-700 border-pink-200"
      };
    }

    const policy = String(room.genderPolicy || "Mixed");
    const normalizedPolicy = policy.toLowerCase();

    if (normalizedPolicy === "male") {
      return {
        label: "Male",
        className: "bg-sky-100 text-sky-700 border-sky-200"
      };
    }

    if (normalizedPolicy === "female") {
      return {
        label: "Female",
        className: "bg-pink-100 text-pink-700 border-pink-200"
      };
    }

    return {
      label: policy,
      className: "bg-slate-100 text-slate-600 border-slate-200"
    };
  };

  const filterOptions = [
    { key: "all", label: "All", count: floorStats.typeCounts.all || 0 },
    { key: "1", label: "Single", count: floorStats.typeCounts[1] || 0 },
    { key: "2", label: "Double", count: floorStats.typeCounts[2] || 0 },
    { key: "3", label: "Triple", count: floorStats.typeCounts[3] || 0 },
    { key: "4", label: "Quad", count: floorStats.typeCounts[4] || 0 }
  ];

  if (loading) {
    return <div className="text-slate-300">Loading room map...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 md:px-6 space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-gradient-to-r from-white via-slate-50 to-indigo-50 p-6 shadow-sm">
        <h1 className="text-3xl font-bold text-slate-900">Floor Plan</h1>
        <p className="text-slate-600 mt-2">See room occupancy status floor by floor.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="text-sm text-slate-500">Floors</div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{floorStructure.length}</div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="text-sm text-slate-500">Total Capacity</div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{summary.capacity}</div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="text-sm text-slate-500">Occupied Beds</div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{summary.occupancy}</div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="text-sm text-slate-500">Occupancy Rate</div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{summary.occupancyRate}%</div>
        </div>
      </div>

      {!currentFloor ? (
        <EmptyState title="Floor not found" description="Please select another floor from the list." />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <aside className="lg:col-span-1 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm h-fit hover:shadow-md transition-shadow">
            <div className="text-xs uppercase tracking-[0.2em] text-slate-500 mb-3">Floors</div>
            <div className="space-y-2">
              {floorStructure.map((floor) => {
                const floorCapacity = floor.rooms.reduce((sum, room) => sum + room.capacity, 0);
                const floorOccupancy = floor.rooms.reduce((sum, room) => sum + room.occupancy, 0);
                const isSelected = selectedFloor === floor.key;

                return (
                  <button
                    key={floor.key}
                    onClick={() => setSelectedFloor(floor.key)}
                    className={`w-full rounded-xl border px-3 py-3 text-left transition ${
                      isSelected ? "border-indigo-200 bg-indigo-50" : "border-slate-200 bg-white hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold text-slate-900">{floor.label}</div>
                        <div className="text-xs text-slate-500 mt-1">{floorOccupancy}/{floorCapacity} occupied</div>
                      </div>
                      <ChevronDown className={`h-4 w-4 text-slate-400 transition ${isSelected ? "rotate-180" : ""}`} />
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="mt-4 border-t border-slate-100 pt-4">
              <div className="text-xs uppercase tracking-[0.2em] text-slate-500 mb-3">Filter</div>
              <div className="flex flex-wrap gap-2">
                {filterOptions.map((option) => {
                  const isActive = selectedCapacityFilter === option.key;

                  return (
                    <button
                      key={option.key}
                      type="button"
                      onClick={() => setSelectedCapacityFilter(option.key)}
                      className={`rounded-full px-3 py-2 text-xs font-semibold transition ${
                        isActive ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                      }`}
                    >
                      {option.label} <span className={isActive ? "text-indigo-100" : "text-slate-500"}>({option.count})</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </aside>

          <div className="lg:col-span-3 space-y-4">
            {(() => {
              return (
                <section className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                  <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 bg-slate-50 px-5 py-4">
                    <div>
                      <div className="text-xs uppercase tracking-[0.25em] text-slate-500">Floor view</div>
                      <h2 className="text-xl font-bold text-slate-900">{currentFloor.label}</h2>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-slate-600">
                      <span className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 shadow-sm">
                        <Users className="h-4 w-4" />
                        {floorStats.floorOccupancy} / {floorStats.floorCapacity}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 shadow-sm">
                        <LayoutGrid className="h-4 w-4" />
                        {floorStats.floorRate}%
                      </span>
                    </div>
                  </div>

                  <div className="p-5">
                    {floorStats.filteredRooms.length > 0 ? (
                      <div className="space-y-3">
                        {floorStats.filteredRooms.map((room) => {
                          const status = roomStatusLabel(room);
                          const genderPolicy = getGenderPolicyDisplay(room);

                          return (
                            <div key={room.id} className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                              <div>
                                <div className="flex items-center gap-2">
                                  <div className="text-base font-semibold text-slate-900">{room.roomNumber}</div>
                                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
                                    {roomTypeLabel(room.capacity)}
                                  </span>
                                </div>
                                <div className={`mt-1 inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${genderPolicy.className}`}>
                                  {genderPolicy.label}
                                </div>
                              </div>

                              <div className="text-right">
                                <div className="text-sm font-semibold text-slate-700">{room.occupancy} / {room.capacity}</div>
                                <div className={status === "Full" ? "text-sm font-semibold text-red-600" : status === "Empty" ? "text-sm font-semibold text-slate-500" : "text-sm font-semibold text-emerald-600"}>
                                  {status}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="rounded-xl bg-slate-50 p-4">
                        <EmptyState compact title="No matching rooms" description="Try another room type filter for this floor." />
                      </div>
                    )}
                  </div>
                </section>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
