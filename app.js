let allData = [];
let filteredData = [];

// Setup
document.addEventListener('DOMContentLoaded', function() {
    setupFileUpload();
    setupEventListeners();
});

// Setup file upload
function setupFileUpload() {
    const fileInput = document.getElementById('fileInput');
    const fileLabel = document.getElementById('fileLabel');

    fileInput.addEventListener('change', handleFileUpload);

    // Drag and drop
    fileLabel.addEventListener('dragover', (e) => {
        e. preventDefault();
        fileLabel.classList.add('dragover');
    });

    fileLabel.addEventListener('dragleave', () => {
        fileLabel.classList.remove('dragover');
    });

    fileLabel.addEventListener('drop', (e) => {
        e. preventDefault();
        fileLabel.classList.remove('dragover');
        const files = e.dataTransfer. files;
        if (files. length > 0) {
            fileInput.files = files;
            handleFileUpload();
        }
    });
}

// Handle file upload
async function handleFileUpload() {
    const fileInput = document.getElementById('fileInput');
    const file = fileInput.files[0];

    if (!file) return;

    try {
        if (file.name.endsWith('.csv')) {
            parseCSV(file);
        } else if (file.name.endsWith('.xlsx') || file.name.endsWith('. xls')) {
            parseExcel(file);
        } else {
            alert('Format file tidak didukung. Gunakan CSV atau Excel.');
            return;
        }

        document.getElementById('searchSection').classList.add('active');
    } catch (error) {
        alert('Error membaca file: ' + error.message);
    }
}

// Parse CSV
function parseCSV(file) {
    const reader = new FileReader();
    reader. onload = function(e) {
        const csv = e.target.result;
        const lines = csv.split('\n'). filter(line => line.trim());
        
        if (lines.length < 2) {
            alert('File CSV harus memiliki minimal 2 baris (header + data)');
            return;
        }

        const headers = lines[0].split(','). map(h => h.trim());
        allData = lines.slice(1).map((line, index) => {
            const values = line.split(',');
            const obj = { id: index + 1 };
            headers.forEach((header, i) => {
                obj[header] = (values[i] || '').trim();
            });
            return obj;
        });

        populateColumnSelect(headers);
        displayResults(allData);
    };
    reader.readAsText(file);
}

// Parse Excel (menggunakan library SheetJS)
async function parseExcel(file) {
    // Jika Anda ingin support Excel, tambahkan script di HTML:
    // <script src="https://cdn.jsdelivr. net/npm/xlsx/dist/xlsx.full.min. js"></script>
    // Kemudian uncomment kode di bawah:

    /*
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet);
    
    const headers = Object.keys(jsonData[0]);
    allData = jsonData.map((row, index) => ({
        id: index + 1,
        ...row
    }));
    
    populateColumnSelect(headers);
    displayResults(allData);
    */

    alert('Excel support memerlukan library tambahan. Gunakan CSV untuk sekarang.');
}

// Setup event listeners
function setupEventListeners() {
    document.getElementById('searchInput').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            searchData();
        }
    });
}

// Populate column select
function populateColumnSelect(headers) {
    const columnSelect = document.getElementById('columnSelect');
    columnSelect.innerHTML = '<option value="">-- Semua Kolom --</option>';
    headers.forEach(header => {
        const option = document.createElement('option');
        option.value = header;
        option.textContent = header;
        columnSelect.appendChild(option);
    });
}

// Search data
function searchData() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase(). trim();
    const columnFilter = document.getElementById('columnSelect'). value;

    if (! searchTerm && !columnFilter) {
        filteredData = [... allData];
    } else {
        filteredData = allData.filter(row => {
            if (columnFilter) {
                const cellValue = String(row[columnFilter] || '').toLowerCase();
                return cellValue.includes(searchTerm);
            } else {
                return Object.values(row).some(value =>
                    String(value).toLowerCase().includes(searchTerm)
                );
            }
        });
    }

    displayResults(filteredData);
}

// Reset search
function resetSearch() {
    document.getElementById('searchInput'). value = '';
    document.getElementById('columnSelect').value = '';
    filteredData = [...allData];
    displayResults(allData);
}

// Display results
function displayResults(data) {
    const tableContainer = document.getElementById('tableContainer');
    const resultsInfo = document.getElementById('resultsInfo');

    if (data.length === 0) {
        tableContainer.innerHTML = `
            <div class="no-results">
                <p>📭 Tidak ada data yang ditemukan</p>
            </div>
        `;
        resultsInfo.style.display = 'none';
        return;
    }

    const headers = Object.keys(data[0]). filter(key => key !== 'id');
    let html = `
        <table>
            <thead>
                <tr>
                    ${headers.map(header => `<th>${escapeHtml(header)}</th>`).join('')}
                </tr>
            </thead>
            <tbody>
                ${data.map(row => `
                    <tr>
                        ${headers.map(header => `<td>${escapeHtml(row[header])}</td>`).join('')}
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;

    tableContainer.innerHTML = html;
    resultsInfo.style.display = 'block';
    document.getElementById('resultCount').textContent = data.length;
}

function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return String(text || '').replace(/[&<>"']/g, m => map[m]);
}