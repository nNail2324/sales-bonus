/**
 * Функция для расчета выручки
 * @param purchase запись о покупке
 * @param _product карточка товара
 * @returns {number}
 */
function calculateSimpleRevenue(purchase, _product) {
    const { sale_price, quantity } = purchase;
    const discount = 1 - (purchase.discount / 100);
  
    // @TODO: Расчет выручки от операции
    return sale_price * quantity * discount;
}

/**
 * Функция для расчета бонусов
 * @param index порядковый номер в отсортированном массиве
 * @param total общее число продавцов
 * @param seller карточка продавца
 * @returns {number}
 */
function calculateBonusByProfit(index, total, seller) {
    const { profit } = seller;
    
    // @TODO: Расчет бонуса от позиции в рейтинге
    if (index === 0) {
        return profit * 0.15;
    } else if (index === 1 || index === 2) {
        return profit * 0.10;
    } else if (index === total - 1) {
        return 0;
    } else {
        return profit * 0.05;
    }
}

/**
 * Функция для анализа данных продаж
 * @param data
 * @param options
 * @returns {{revenue, top_products, bonus, name, sales_count, profit, seller_id}[]}
 */
function analyzeSalesData(data, options) {
    const { calculateRevenue, calculateBonus } = options;

    // @TODO: Проверка входных данных
    if (
        !data 
        || !Array.isArray(data.customers) 
        || !Array.isArray(data.products) 
        || !Array.isArray(data.sellers) 
        || !Array.isArray(data.purchase_records)
        || data.customers.length === 0 
        || data.products.length === 0 
        || data.sellers.length === 0 
        || data.purchase_records.length === 0  
    ) {
        throw new Error('Некорректные входные данные');
    } 

    // @TODO: Подготовка промежуточных данных для сбора статистики
    const sellerStats = data.sellers.map(seller => {
        return {
            id : seller.id, 
            name : `${seller.first_name} ${seller.last_name}`, 
            revenue : 0, 
            profit : 0, 
            sales_count : 0, 
            products_sold : {}
        };
    }); 

    // @TODO: Индексация продавцов и товаров для быстрого доступа
    const sellerIndex = sellerStats.reduce((result, item) => {
        result[item.id] = item;
        return result;
    }, {}); 

    const productIndex = data.products.reduce((result, item) => {
        result[item.sku] = item;
        return result;
    }, {});

    // @TODO: Расчет выручки и прибыли для каждого продавца
    data.purchase_records.forEach(record => { // Чек 
        const seller = sellerIndex[record.seller_id]; // Продавец

        // Увеличить количество продаж
        seller.sales_count += 1;
        // Увеличить общую сумму выручки всех продаж
        seller.revenue += record.total_amount;

        // Расчёт прибыли для каждого товара
        record.items.forEach(item => {
            const product = productIndex[item.sku]; // Товар
            // Посчитать себестоимость (cost) товара как product.purchase_price, умноженную на количество товаров из чека
            const cost = item.quantity * product.purchase_price;
            // Посчитать выручку (revenue) с учётом скидки через функцию calculateRevenue
            const revenue = calculateRevenue(item);
            // Посчитать прибыль: выручка минус себестоимость
            const profit = revenue - cost;
            // Увеличить общую накопленную прибыль (profit) у продавца  
            seller.profit += profit;
            // Учёт количества проданных товаров
            if (!seller.products_sold[item.sku]) {
                seller.products_sold[item.sku] = 0;
            }
            // По артикулу товара увеличить его проданное количество у продавца
            seller.products_sold[item.sku] += 1;
        });
    });

    // @TODO: Сортировка продавцов по прибыли
    sellerStats.sort((a, b) => b.profit - a.profit);
    // @TODO: Назначение премий на основе ранжирования
    sellerStats.forEach((seller, index, sellers) => {
        seller.bonus = calculateBonus(index, sellers.length, seller); // Считаем бонус
        seller.top_products = Object.entries(seller.products_sold) // Формируем топ-10 товаров
            .map(([sku, quantity]) => ({sku, quantity}))
            .sort((a, b) => b.quantity - a.quantity)
            .slice(0, 10);
    }); 

    return sellerStats.map(seller => ({
        seller_id: seller.id, // Строка, идентификатор продавца
        name: seller.name, // Строка, имя продавца
        revenue: +seller.revenue.toFixed(2), // Число с двумя знаками после точки, выручка продавца
        profit: +seller.profit.toFixed(2), // Число с двумя знаками после точки, прибыль продавца
        sales_count: seller.sales_count, // Целое число, количество продаж продавца
        top_products: seller.top_products, // Массив объектов вида: { "sku": "SKU_008","quantity": 10}, топ-10 товаров продавца
        bonus: +seller.bonus.toFixed(2), // Число с двумя знаками после точки, бонус продавца
    })); 
    // @TODO: Подготовка итоговой коллекции с нужными полями
}
