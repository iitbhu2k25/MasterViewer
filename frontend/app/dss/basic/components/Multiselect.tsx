'use client'
import React, { useState, useEffect, useRef } from 'react';

interface Item {
    id?: number| string;
  name: string;
  [key: string]: any; // Allow for additional properties
}



interface MultiSelectProps<T extends Item> {
  items: T[];
  selectedItems: string[];
  onSelectionChange: (selectedIds: string[]) => void;
  label: string;
  placeholder: string;
  disabled?: boolean;
  displayPattern?: (item: T) => string;
  groupBy?: (items: T[]) => { [key: string]: T[] };
  useNestedGroups?: boolean;
  nestedGroupBy?: (items: T[]) => { [key: string]: { [key: string]: T[] } };
  showGroupHeaders?: boolean;
  groupHeaderFormat?: string;
  districtHeaderFormat?: string;
  subDistrictHeaderFormat?: string;
  itemKey?: string; // ADD THIS LINE - allows specifying which property to use as identifier
}

export const MultiSelect = <T extends Item>(props: MultiSelectProps<T>) => {
  // Destructure props with default values
  const {
    items,
    selectedItems,
    onSelectionChange,
    label,
    placeholder,
    disabled = false,
    displayPattern = (item) => item.name || '',
    groupBy,
    useNestedGroups = false,
    nestedGroupBy,
    showGroupHeaders = false,
    groupHeaderFormat = "Group: {groupName}",
    districtHeaderFormat = "District: {districtName}",
    subDistrictHeaderFormat = "Sub-District: {subDistrictName}",
    itemKey = 'id'
  } = props;

  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Helper function to get item identifier
  const getItemId = (item: T): string => {
    return String(item[itemKey]);
  };
  
  // Handle outside click to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  
  // Filter items based on search term
  const filteredItems = items.filter(item => 
    displayPattern(item).toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // Group items if groupBy function is provided
  const groupedItems = groupBy ? groupBy(filteredItems) : null;
  const nestedGroupedItems = nestedGroupBy && useNestedGroups ? nestedGroupBy(filteredItems) : null;
  
  // Toggle all items
  const handleToggleAll = () => {
    if (selectedItems.length === items.length) {
      // If all are selected, deselect all
      onSelectionChange([]);
    } else {
      // Otherwise, select all
            onSelectionChange(items.map(item => getItemId(item))); 
    }
  };
  




  // Toggle a single item
  const handleToggleItem = (itemId: string) => {
  if (!itemId) {
    console.warn('Invalid itemId in handleToggleItem:', itemId);
    return;
  }
  console.log('Toggling item in MultiSelect:', {
    itemId,
    currentSelected: selectedItems,
    willBeSelected: !selectedItems.includes(itemId),
  });
  if (selectedItems.includes(itemId)) {
    onSelectionChange(selectedItems.filter(id => id !== itemId));
  } else {
    onSelectionChange([...selectedItems, itemId]);
  }
};
  
  // Toggle all items in a group
  const handleToggleGroup = (groupItems: T[]) => {
    const groupItemIds = groupItems.map(item => getItemId(item)); // CHANGED
    const allSelected = groupItemIds.every(id => selectedItems.includes(id));
    
    if (allSelected) {
      onSelectionChange(selectedItems.filter(id => !groupItemIds.includes(id)));
    } else {
      const newSelection = [...selectedItems];
      groupItemIds.forEach(id => {
        if (!newSelection.includes(id)) {
          newSelection.push(id);
        }
      });
      onSelectionChange(newSelection);
    }
  };
  
  // Determine if all items in a group are selected
  const isGroupSelected = (groupItems: T[]) => {
    return groupItems.every(item => selectedItems.includes(getItemId(item))); // CHANGED
  };
  
  // Determine if some (but not all) items in a group are selected
  const isGroupPartiallySelected = (groupItems: T[]) => {
    const selected = groupItems.some(item => selectedItems.includes(getItemId(item))); // CHANGED
    return selected && !isGroupSelected(groupItems);
  };
;
  
  // Display selected items summary
  const getSelectedDisplay = () => {
    if (selectedItems.length === 0) {
      return placeholder;
    } else if (selectedItems.length === items.length) {
      return 'All Items Selected';
    } else {
      return `${selectedItems.length} Selected`;
    }
  };

  // Format group header based on template
  const formatGroupHeader = (groupName: string) => {
    return groupHeaderFormat.replace('{groupName}', groupName);
  };

  // Format district header based on template
  const formatDistrictHeader = (districtName: string) => {
    return districtHeaderFormat.replace('{districtName}', districtName);
  };

  // Format sub-district header based on template
  const formatSubDistrictHeader = (subDistrictName: string) => {
    return subDistrictHeaderFormat.replace('{subDistrictName}', subDistrictName);
  };
  
  
return (
  <div className="relative" ref={dropdownRef}>
    <label className="block text-sm font-semibold text-gray-700 mb-2">
      {label}:
    </label>
    <div 
      className={`p-2 border rounded-md cursor-pointer ${
        disabled 
          ? 'bg-blue-100 border-gray-300 cursor-not-allowed' 
          : 'border-blue-500 focus:ring-2 focus:ring-blue-500'
      }`}
      onClick={() => !disabled && setIsOpen(!isOpen)}
    >
      <div className="flex justify-between items-center">
        <div className="text-sm truncate">
          {getSelectedDisplay()}
        </div>
        <div>
          <svg 
            className={`w-4 h-4 transition-transform ${isOpen ? 'transform rotate-180' : ''}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24" 
            xmlns="http://www.w3.org/2000/svg"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
    </div>
    
    {isOpen && !disabled && (
      <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
        {/* Search Input */}
        <div className="sticky top-0 bg-white p-2 border-b border-gray-200">
          <input
            type="text"
            className="w-full p-2 text-sm border border-gray-300 rounded-md"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
        
        {/* Select All Option */}
        <div 
          className="p-2 hover:bg-gray-100 border-b border-gray-200 cursor-pointer w-full"
          onClick={(e) => {
            e.stopPropagation();
            handleToggleAll();
          }}
        >
          <div className="flex items-center space-x-2 w-full">
            <input
              type="checkbox"
              checked={selectedItems.length === items.length && items.length > 0}
              onChange={() => {}}
              className="form-checkbox h-4 w-4 text-blue-600 pointer-events-none"
            />
            <span className="text-sm font-medium">Select All</span>
          </div>
        </div>
        
        {/* Nested Grouped Items (for Villages with District > SubDistrict structure) */}
        {useNestedGroups && nestedGroupedItems ? (
          Object.entries(nestedGroupedItems).sort(([a], [b]) => a.localeCompare(b)).map(([districtName, subDistrictGroups]) => (
            <div key={districtName} className="border-b border-gray-200 last:border-b-0">
              {/* District Group Header */}
              <div className="p-2 bg-gray-100 font-medium text-sm">
                {formatDistrictHeader(districtName)}
              </div>
              
              {/* SubDistrict Groups */}
              {Object.entries(subDistrictGroups).sort(([a], [b]) => a.localeCompare(b)).map(([subDistrictName, villages]) => (
                <div key={`${districtName}-${subDistrictName}`} className="border-t border-gray-100">
                  {/* SubDistrict Header */}
                  <div 
                    className="pl-4 p-2 bg-gray-50 hover:bg-gray-100 cursor-pointer w-full"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleGroup(villages);
                    }}
                  >
                    <div className="flex items-center space-x-2 w-full">
                      <input
                        type="checkbox"
                        checked={isGroupSelected(villages)}
                        onChange={() => {}}
                        ref={input => {
                          if (input) {
                            input.indeterminate = isGroupPartiallySelected(villages);
                          }
                        }}
                        className="form-checkbox h-4 w-4 text-blue-600 pointer-events-none"
                      />
                      <span className="text-sm font-medium">{formatSubDistrictHeader(subDistrictName)}</span>
                      <span className="text-xs text-gray-500">({villages.length})</span>
                    </div>
                  </div>
                  
                  {/* Villages within SubDistrict */}
                  <div className="pl-8">
                    {villages.map(village => (
                      <div 
                        key={village.id}
                        className="p-2 hover:bg-gray-100 cursor-pointer w-full"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleItem(getItemId(village as T));
                        }}
                      >
                        <div className="flex items-center space-x-2 w-full">
                          <input
                            type="checkbox"
                            checked={selectedItems.includes(getItemId(village as T))}
                            onChange={() => {}}
                            className="form-checkbox h-4 w-4 text-blue-600 pointer-events-none"
                          />
                          <span className="text-sm">{displayPattern(village as unknown as T)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ))
        ) : groupedItems ? (
          // Standard Grouped items
          Object.entries(groupedItems).sort(([a], [b]) => a.localeCompare(b)).map(([groupName, groupItems]) => (
            <div key={groupName} className="border-b border-gray-200 last:border-b-0">
              {/* Group Header */}
              {showGroupHeaders && (
                <div className="p-2 bg-gray-100 font-medium text-sm">
                  {formatGroupHeader(groupName)}
                </div>
              )}
              
              {/* Group Toggle */}
              <div 
                className={`p-2 ${showGroupHeaders ? 'pl-4' : ''} ${showGroupHeaders ? 'bg-gray-50' : 'bg-gray-50'} hover:bg-gray-100 cursor-pointer w-full`}
                onClick={(e) => {
                  e.stopPropagation();
                  handleToggleGroup(groupItems);
                }}
              >
                <div className="flex items-center space-x-2 w-full">
                  <input
                    type="checkbox"
                    checked={isGroupSelected(groupItems)}
                    onChange={() => {}}
                    ref={input => {
                      if (input) {
                        input.indeterminate = isGroupPartiallySelected(groupItems);
                      }
                    }}
                    className="form-checkbox h-4 w-4 text-blue-600 pointer-events-none"
                  />
                  <span className="text-sm font-medium">{showGroupHeaders ? 'Select All' : groupName}</span>
                  <span className="text-xs text-gray-500">({groupItems.length})</span>
                </div>
              </div>
              
              {/* Group Items */}
              <div className={`${showGroupHeaders ? 'pl-8' : 'pl-6'}`}>
                {groupItems.map(item => (
                  <div 
                    key={getItemId(item)}
                    className="p-2 hover:bg-gray-100 cursor-pointer w-full"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleItem(getItemId(item));
                    }}
                  >
                    <div className="flex items-center space-x-2 w-full">
                      <input
                        type="checkbox"
                        checked={selectedItems.includes(getItemId(item))}
                        onChange={() => {}}
                        className="form-checkbox h-4 w-4 text-blue-600 pointer-events-none"
                      />
                      <span className="text-sm">{displayPattern(item)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        ) : (
          // Flat list of items
          filteredItems.map(item => (
            <div 
              key={getItemId(item)}
              className="p-2 hover:bg-gray-100 cursor-pointer w-full"
              onClick={(e) => {
                e.stopPropagation();
                handleToggleItem(getItemId(item));
              }}
            >
              <div className="flex items-center space-x-2 w-full">
                <input
                  type="checkbox"
                  checked={selectedItems.includes(getItemId(item))}
                  onChange={() => {}}
                  className="form-checkbox h-4 w-4 text-blue-600 pointer-events-none"
                />
                <span className="text-sm">{displayPattern(item)}</span>
              </div>
            </div>
          ))
        )}
        
        {filteredItems.length === 0 && (
          <div className="p-3 text-center text-gray-500 text-sm">
            No items found
          </div>
        )}
      </div>
    )}
  </div>
);
};