let users = [];
let usersPagination = {
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
};

let rankStats = {
    BRONZE: 0,
    SILVER: 0,
    GOLD: 0,
    DIAMOND: 0
};

// RANK_OPTIONS is defined in common.js

async function loadRanksPage() {
    console.log('loadRanksPage called');
    usersPagination.page = 1;

    try {
        await Promise.all([
            loadRankStatistics(),
            loadUsers(1, usersPagination.limit)
        ]);
        setupUserSearch();
        setupUserPagination();
    } catch (error) {
        console.error('Error in loadRanksPage:', error);
    }
}

async function loadRankStatistics() {
    const container = document.getElementById('rank-statistics');
    if (!container) {
        console.error('rank-statistics container not found');
        return;
    }

    try {
        // Load all users to calculate statistics
        const data = await fetchIdentityAPI('/users?page=1&limit=1000');
        console.log('loadRankStatistics response:', data);

        if (data?.result) {
            let allUsers = [];
            if (data.result && typeof data.result === 'object' && data.result.result) {
                allUsers = data.result.result || [];
            } else if (Array.isArray(data.result)) {
                allUsers = data.result;
            }

            console.log('All users loaded:', allUsers.length);

            // Calculate statistics
            rankStats = {
                BRONZE: 0,
                SILVER: 0,
                GOLD: 0,
                DIAMOND: 0
            };

            allUsers.forEach(user => {
                const rank = user.rank || 'BRONZE';
                if (rankStats.hasOwnProperty(rank)) {
                    rankStats[rank]++;
                }
            });

            console.log('Rank stats calculated:', rankStats);
            renderRankStatistics();
        } else {
            console.error('No result in loadRankStatistics:', data);
            container.innerHTML = '<div style="text-align: center; padding: 20px; color: #f44336;">Không thể tải thống kê. Vui lòng kiểm tra quyền truy cập.</div>';
        }
    } catch (error) {
        console.error('Error loading rank statistics:', error);
        if (container) {
            container.innerHTML = `<div style="text-align: center; padding: 20px; color: #f44336;">Lỗi khi tải thống kê: ${error.message}</div>`;
        }
    }
}

function renderRankStatistics() {
    const container = document.getElementById('rank-statistics');
    if (!container) {
        console.error('rank-statistics container not found');
        return;
    }

    const totalUsers = Object.values(rankStats).reduce((sum, count) => sum + count, 0);

    container.innerHTML = `
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px;">
            ${RANK_OPTIONS.map(rank => {
        const count = rankStats[rank.value] || 0;
        const percentage = totalUsers > 0 ? ((count / totalUsers) * 100).toFixed(1) : 0;
        return `
                    <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); border-left: 4px solid ${rank.color};">
                        <div style="font-size: 24px; font-weight: bold; color: ${rank.color}; margin-bottom: 5px;">
                            ${count}
                        </div>
                        <div style="font-size: 14px; color: #666; margin-bottom: 5px;">
                            ${rank.label}
                        </div>
                        <div style="font-size: 12px; color: #999;">
                            ${percentage}% • ${rank.threshold}
                        </div>
                    </div>
                `;
    }).join('')}
        </div>
    `;
}

async function loadUsers(page = 1, limit = 20) {
    const tbody = document.getElementById('users-table-body');
    if (!tbody) {
        console.error('users-table-body not found');
        return;
    }

    try {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 40px;">Đang tải...</td></tr>';

        const data = await fetchIdentityAPI(`/users?page=${page}&limit=${limit}`);
        console.log('loadUsers response:', data);

        if (data?.result) {
            if (data.result && typeof data.result === 'object' && data.result.result) {
                users = data.result.result || [];
                usersPagination.total = data.result.total || 0;
                usersPagination.totalPages = data.result.totalPages || 1;
            } else if (Array.isArray(data.result)) {
                users = data.result;
                usersPagination.total = users.length;
                usersPagination.totalPages = 1;
            } else {
                users = [];
                usersPagination.total = 0;
                usersPagination.totalPages = 0;
            }
            usersPagination.page = page;
            usersPagination.limit = limit;

            console.log('Users loaded:', users.length);
            await renderUsers(users);
            updateUserPaginationUI();
        } else {
            console.error('No result in loadUsers:', data);
            users = [];
            tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 40px; color: #f44336;">Không thể tải dữ liệu. Vui lòng kiểm tra quyền truy cập.</td></tr>';
            updateUserPaginationUI();
        }
    } catch (error) {
        console.error('Error loading users:', error);
        users = [];
        tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; padding: 40px; color: #f44336;">Lỗi khi tải dữ liệu: ${error.message}</td></tr>`;
        updateUserPaginationUI();
    }
}

async function renderUsers(usersToRender) {
    const tbody = document.getElementById('users-table-body');
    if (!tbody) {
        console.error('users-table-body not found');
        return;
    }

    if (!usersToRender || usersToRender.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 40px;">Không có dữ liệu</td></tr>';
        return;
    }

    tbody.innerHTML = usersToRender.map(user => {
        const rank = user.rank || 'BRONZE';
        const rankInfo = RANK_OPTIONS.find(r => r.value === rank);
        const rankColor = rankInfo?.color || '#999';
        const rankLabel = rankInfo?.label || rank;

        const totalSpent = user.totalSpent || 0;
        const formattedSpent = formatCurrency(totalSpent);

        // Calculate next rank info
        let nextRankInfo = null;
        if (rank === 'BRONZE') {
            nextRankInfo = RANK_OPTIONS.find(r => r.value === 'SILVER');
        } else if (rank === 'SILVER') {
            nextRankInfo = RANK_OPTIONS.find(r => r.value === 'GOLD');
        } else if (rank === 'GOLD') {
            nextRankInfo = RANK_OPTIONS.find(r => r.value === 'DIAMOND');
        }

        const remainingToNext = nextRankInfo ? calculateRemainingToNextRank(totalSpent, rank) : null;

        return `
            <tr>
                <td>${user.id || '-'}</td>
                <td><strong>${user.username || '-'}</strong></td>
                <td>${user.firstName || ''} ${user.lastName || ''}</td>
                <td>
                    <span class="status-badge" style="background: ${rankColor}; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px;">
                        ${rankLabel}
                    </span>
                </td>
                <td><strong>${formattedSpent}</strong></td>
                <td>
                    ${remainingToNext ? `
                        <span style="font-size: 12px; color: #666;">
                            Còn ${formatCurrency(remainingToNext)} để lên ${nextRankInfo.label}
                        </span>
                    ` : '<span style="color: #999; font-size: 12px;">Đã đạt hạng cao nhất</span>'}
                </td>
                <td>
                    <button class="btn btn-sm btn-secondary" onclick="viewUserDetail('${user.id}')" style="padding: 4px 8px; font-size: 12px;">Chi tiết</button>
                </td>
            </tr>
        `;
    }).join('');
}

function calculateRemainingToNextRank(totalSpent, currentRank) {
    if (currentRank === 'BRONZE') {
        return Math.max(0, 10000000 - totalSpent);
    } else if (currentRank === 'SILVER') {
        return Math.max(0, 40000000 - totalSpent);
    } else if (currentRank === 'GOLD') {
        return Math.max(0, 100000000 - totalSpent);
    }
    return null; // DIAMOND is highest
}

function setupUserSearch() {
    const searchInput = document.getElementById('user-search');
    if (!searchInput) return;

    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        if (!searchTerm) {
            renderUsers(users);
            return;
        }
        const filtered = users.filter(u =>
            u.username?.toLowerCase().includes(searchTerm) ||
            u.firstName?.toLowerCase().includes(searchTerm) ||
            u.lastName?.toLowerCase().includes(searchTerm) ||
            u.id?.toLowerCase().includes(searchTerm)
        );
        renderUsers(filtered);
    });
}

function setupUserPagination() {
    const paginationDiv = document.getElementById('users-pagination');
    if (!paginationDiv) return;

    paginationDiv.addEventListener('click', async (e) => {
        if (e.target.classList.contains('page-btn')) {
            const page = parseInt(e.target.dataset.page);
            if (page >= 1 && page <= usersPagination.totalPages) {
                await loadUsers(page, usersPagination.limit);
            }
        }
    });
}

function updateUserPaginationUI() {
    const paginationDiv = document.getElementById('users-pagination');
    if (!paginationDiv) return;

    if (usersPagination.totalPages <= 1) {
        paginationDiv.innerHTML = '';
        return;
    }

    let html = '<div style="display: flex; gap: 5px; justify-content: center; align-items: center; margin-top: 20px;">';

    html += `<button class="page-btn" data-page="${usersPagination.page - 1}" ${usersPagination.page === 1 ? 'disabled' : ''} style="padding: 8px 12px; border: 1px solid #ddd; background: white; cursor: pointer; border-radius: 4px;">Trước</button>`;

    for (let i = 1; i <= usersPagination.totalPages; i++) {
        if (i === 1 || i === usersPagination.totalPages || (i >= usersPagination.page - 1 && i <= usersPagination.page + 1)) {
            html += `<button class="page-btn" data-page="${i}" ${i === usersPagination.page ? 'style="padding: 8px 12px; border: 1px solid #007bff; background: #007bff; color: white; cursor: pointer; border-radius: 4px;"' : 'style="padding: 8px 12px; border: 1px solid #ddd; background: white; cursor: pointer; border-radius: 4px;"'}>${i}</button>`;
        } else if (i === usersPagination.page - 2 || i === usersPagination.page + 2) {
            html += '<span style="padding: 8px;">...</span>';
        }
    }

    html += `<button class="page-btn" data-page="${usersPagination.page + 1}" ${usersPagination.page === usersPagination.totalPages ? 'disabled' : ''} style="padding: 8px 12px; border: 1px solid #ddd; background: white; cursor: pointer; border-radius: 4px;">Sau</button>`;

    html += `</div><div style="text-align: center; margin-top: 10px; color: #666; font-size: 14px;">Trang ${usersPagination.page} / ${usersPagination.totalPages} (Tổng: ${usersPagination.total})</div>`;

    paginationDiv.innerHTML = html;
}

async function viewUserDetail(userId) {
    const data = await fetchIdentityAPI(`/users/${userId}`);
    if (data?.result) {
        const user = data.result;
        const rank = user.rank || 'BRONZE';
        const rankInfo = RANK_OPTIONS.find(r => r.value === rank);

        const detailHtml = `
            <div style="padding: 20px;">
                <h3 style="margin-top: 0;">Chi tiết User</h3>
                <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                        <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold; width: 200px;">ID:</td>
                        <td style="padding: 8px; border-bottom: 1px solid #eee;">${user.id}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Username:</td>
                        <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>${user.username}</strong></td>
                    </tr>
                    <tr>
                        <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Họ tên:</td>
                        <td style="padding: 8px; border-bottom: 1px solid #eee;">${user.firstName || ''} ${user.lastName || ''}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Hạng hiện tại:</td>
                        <td style="padding: 8px; border-bottom: 1px solid #eee;">
                            <span style="background: ${rankInfo?.color || '#999'}; color: white; padding: 4px 8px; border-radius: 4px;">
                                ${rankInfo?.label || rank}
                            </span>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Tổng chi tiêu:</td>
                        <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>${formatCurrency(user.totalSpent || 0)}</strong></td>
                    </tr>
                    <tr>
                        <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Ngưỡng hạng:</td>
                        <td style="padding: 8px; border-bottom: 1px solid #eee;">${rankInfo?.threshold || '-'}</td>
                    </tr>
                </table>
            </div>
        `;

        alert(detailHtml.replace(/<[^>]*>/g, '')); // Simple text alert
    }
}

function filterUsersByRank(rank) {
    const filtered = rank === 'ALL'
        ? users
        : users.filter(u => (u.rank || 'BRONZE') === rank);
    renderUsers(filtered);
}

async function refreshUsers() {
    await Promise.all([
        loadRankStatistics(),
        loadUsers(usersPagination.page, usersPagination.limit)
    ]);
}

// Expose functions to global scope
window.loadRanksPage = loadRanksPage;
window.viewUserDetail = viewUserDetail;
window.filterUsersByRank = filterUsersByRank;
window.refreshUsers = refreshUsers;

