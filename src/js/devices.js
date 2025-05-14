 const devices = [
      { serialNumber: 'SN1234', computerName: 'PC001', deviceType: 'Laptop', brand: 'Dell', model: 'XPS 13' },
      { serialNumber: 'SN5678', computerName: 'PC002', deviceType: 'Desktop', brand: 'HP', model: 'Pavilion 15' },
      { serialNumber: 'SN91011', computerName: 'PC003', deviceType: 'Laptop', brand: 'Apple', model: 'MacBook Pro' },
      { serialNumber: 'SN121314', computerName: 'PC004', deviceType: 'Tablet', brand: 'Samsung', model: 'Galaxy Tab' }
    ];

    function applyFilters() {
      const serialNumberSearch = document.getElementById('serialNumberSearch').value.toLowerCase();
      const computerNameSearch = document.getElementById('computerNameSearch').value.toLowerCase();
      const deviceTypeSelect = document.getElementById('deviceTypeSelect').value;
      const brandSelect = document.getElementById('brandSelect').value;
      const modelSelect = document.getElementById('modelSelect').value;

      const filteredDevices = devices.filter(device => {
        return (
          (serialNumberSearch === '' || device.serialNumber.toLowerCase().includes(serialNumberSearch)) &&
          (computerNameSearch === '' || device.computerName.toLowerCase().includes(computerNameSearch)) &&
          (deviceTypeSelect === '' || device.deviceType === deviceTypeSelect) &&
          (brandSelect === '' || device.brand === brandSelect) &&
          (modelSelect === '' || device.model === modelSelect)
        );
      });

      displayDevices(filteredDevices);
    }

    function displayDevices(devicesList) {
      const tableBody = document.getElementById('devicesTableBody');
      tableBody.innerHTML = '';

      devicesList.forEach(device => {
        const row = document.createElement('tr');
        
        row.innerHTML = `
          <td>${device.serialNumber}</td>
          <td>${device.computerName}</td>
          <td>${device.deviceType}</td>
          <td>${device.brand}</td>
          <td>${device.model}</td>
          <td><button onclick="viewDetails('${device.deviceType}', '${device.brand}', '${device.model}')">View Details</button></td>
        `;
        
        if (device.deviceType === 'Laptop' && device.serialNumber === 'SN1234') {
          row.classList.add('row-alert');
        }

        tableBody.appendChild(row);
      });
    }

    function viewDetails(deviceType, brand, model) {
      const url = `ungrouped.html?type=${encodeURIComponent(deviceType)}&brand=${encodeURIComponent(brand)}&model=${encodeURIComponent(model)}`;
      window.location.href = url;
    }

    window.onload = () => {
      displayDevices(devices);
    };