var TelegramBot = require('node-telegram-bot-api');
var fastcsv = require("fast-csv");
var mysql = require('mysql');
const schedule = require('node-schedule');
const server = require("./serverConfig");
const telegram = require("./telegram");

var bot = new TelegramBot(telegram, {
    polling: true
});

mysql.createPool(server);

function sendTime(time, chatId, text, options) {
    new schedule.scheduleJob({
        start: new Date(Date.now() + Number(time) * 1000 * 60),
        end: new Date(new Date(Date.now() + Number(time) * 1000 * 60 + 1000)),
        rule: '*/1 * * * * *'
    }, function () {
        bot.sendMessage(chatId, text, options);
    });
}

var menu = {
    parse_mode: "HTML",
    reply_markup: {
        resize_keyboard: true,
        one_time_keyboard: true,
        keyboard: [
            ["Владелец", "Номер счетчика"],
            ["Номер пломбы", "Расчетный счет"],
            ["Помощь"]
        ]
    }
};
var adminMenu = {
    parse_mode: "HTML",
    reply_markup: {
        resize_keyboard: true,
        one_time_keyboard: true,
        keyboard: [
            ["Очистить базу счетчиков"], 
            ["Очистить базу пользователей", "Дать базовые права доступа."]
        ]
    }
};


function delete_counters_db(chatId) {
    var sql1 = "DROP TABLE IF EXISTS countersInfo";
    pool.getConnection(function (err, connection) {
        connection.query(sql1, function (err) {
            if (err) {
                bot.sendMessage(chatId, "Что то пошло не так...");
                throw err;
            } else {
                bot.sendMessage(chatId, "База данных успешно удалена.");
            }
        });
        connection.release();
    });
}

function create_counters_db(chatId) {
    let sql2 = "CREATE TABLE countersInfo " +
        "(counter_id VARCHAR(255), " +
        "number_calc VARCHAR(250), " +
        "number_plomb VARCHAR(250), " +
        "owner VARCHAR(250), " +
        "adress VARCHAR(250), " +
        "object VARCHAR(250), " +
        "type VARCHAR(250), " +
        "power VARCHAR(250), " +
        "phone VARCHAR(250), " +
        "message VARCHAR(250), " +
        "Id INT not null AUTO_INCREMENT, " +
        " PRIMARY KEY (Id))";
    pool.getConnection(function (err, connection) {
        connection.query(sql2, function (err) {
            if (err) {
                bot.sendMessage(chatId, "Что то пошло не так...");
                throw err;
            } else {
                bot.sendMessage(chatId, "База данных успешно создана.");
            }
        });
        connection.release();
    });
}

function add_counter(list) {
    if (list.length < 10) {
        for (let n = list.length; n < 10; n++) {
            list[n] = "-";
        }
    }
    let str = "Values ('";
    for (let i = 0; i < list.length - 1; i++) {
        str += list[i] + "','";
    }
    str += list[list.length - 1] + "')";
    let sql3 = "Insert into countersInfo (counter_id, number_calc, number_plomb, owner, adress, object, type, power, phone, message) " + str;

    pool.getConnection(function (err, connection) {
        connection.query(sql3, function (err) {
            if (err) {
                bot.sendMessage(chatId, "Что то пошло не так...");
                throw err;
            } else {
                bot.sendMessage(chatId, "Счетчик добавлен в базу данных.");
            }
        });
        connection.release();
    });
}

function create_users_db(chatId) {
    let sql2 = "CREATE TABLE users " +
        "(user_id VARCHAR(255), " +
        "request_status VARCHAR(255), " +
        "request_count VARCHAR(250), " +
        "admin VARCHAR(20)," +
        "Id INT not null AUTO_INCREMENT, " +
        " PRIMARY KEY (Id))";
    pool.getConnection(function (err, connection) {
        connection.query(sql2, function (err) {
            if (err) {
                bot.sendMessage(chatId, "Что то пошло не так...");
                throw err;
            } else {
                bot.sendMessage(chatId, "База данных успешно создана.");
            }
        });
        connection.release();
    });
}

function turncate_users_db(msg) {

    let sql2 = "TRUNCATE TABLE users";
    pool.getConnection(function (err, connection) {
        connection.query(sql2, function (err) {
            if (err) {
                bot.sendMessage(msg.chat.id, "Что то пошло не так...2");
                throw err;
            } else {
                bot.sendMessage(msg.chat.id, "База пользователей очищена.");
                let sql3 = "Insert into users (user_id, request_status,request_count, admin) Values ('" + msg.from.id + "','-','0','Админ')";
                connection.query(sql3, function (err) {
                    if (err) {
                        bot.sendMessage(msg.chat.id, "Что то пошло не так...2");
                        throw err;
                    } else {
                        bot.sendMessage(msg.chat.id, "Администратор добавлен.");
                    }
                });
            }
        });
        connection.release();
    });
}

function turncate_counters_db(msg) {
    let sql2 = "TRUNCATE TABLE countersInfo";
    pool.getConnection(function (err, connection) {
        connection.query(sql2, function (err) {
            if (err) {
                bot.sendMessage(msg.chat.id, "Что то пошло не так...");
                throw err;
            } else {
                bot.sendMessage(msg.chat.id, "База пользователей очищена.");
            }
        });
        connection.release();
    });
}



function add_user(list) {

    get_user(list.user_id, function(list){
        // bot.sendMessage(chatId, "Пользователь уже есть в базе данных.");
    },
    function(){
        let str = "Values ('" + list.user_id + "','" + list.request_status + "', '0', '" + list.admin + "')";
        let sql3 = "Insert into users (user_id, request_status, request_count, admin) " + str;
        pool.getConnection(function (err, connection) {
            connection.query(sql3, function (err) {
            });
            connection.release();
        });
    });
}

function get_user(userId, callback1, callback2) {
    let sql4 = "SELECT * FROM users WHERE user_id = '" + userId + "'";
    pool.getConnection(function (error, connection) {
        connection.query(sql4, function (err, results) {
            if (err) {
                callback2();
            } else {
                if (results.length == 0) {
                    callback2();
                } else {
                    let list = {
                        "admin": results[0].admin,
                        "user_id": results[0].user_id,
                        "request_count": results[0].request_count,
                        "request_status": results[0].request_status
                    };
                    callback1(list);
                }
            }

        });
        connection.release();
        if (error) {
            callback2();
        }
    });

}

function get_status(userId, callback1, callback2) {
    let sql4 = "SELECT * FROM users WHERE user_id = '" + userId + "'";
    pool.getConnection(function (error, connection) {
        connection.query(sql4, function (err, results) {
            if (err) {
                callback2();
            } else {
                if (results.length == 0) {
                    callback2();
                } else {
                    let list = {
                        "admin": results[0].admin,
                        "user_id": results[0].user_id,
                        "request_count": results[0].request_count,
                        "request_status": results[0].request_status
                    };
                    callback1();
                }
            }

        });
        connection.release();
        if (error) {
            callback2();
        }
    });

}

function show_user(msg, userId) {
    let chatId = msg.chat.id;
    let sql4 = "SELECT * FROM users WHERE user_id = '" + userId + "'";
    pool.getConnection(function (error, connection) {
        connection.query(sql4, function (err, results) {
            if (err) {
                bot.sendMessage(chatId, "Пользователя нет в базе данных");
            } else {
                if (results.length == 0) {
                    bot.sendMessage(chatId, "Пользователя нет в базе данных");
                } else {
                    let list = {
                        "admin": results[0].admin,
                        "user_id": results[0].user_id,
                        "request_count": results[0].request_count,
                        "request_status": results[0].request_status
                    };
                    bot.sendMessage(chatId, "Уровень доступа: <b>" + list.admin + "</b> \nID: <b>" + list.user_id +
                        "</b> \nСтатус запроса: <b>" + list.request_status + "</b>", {parse_mode: "HTML"});
                }
            }

        });
        connection.release();
        if (error) {
            bot.sendMessage(chatId, "Пользователя нет в базе данных");
        }
    });

}

function get_allUsers(chatId) {
    try {
        let sql4 = "SELECT * FROM users";
        pool.getConnection(function (error, connection) {
            connection.query(sql4, function (err, results) {
                if (err) {
                    bot.sendMessage(chatId, "Пользователей в базе данных нету.", {
                        parse_mode: "HTML"
                    });
                } else {
                    if (results.length == 0) {
                        bot.sendMessage(chatId, "Пользователей в базе данных нету.", {
                            parse_mode: "HTML"
                        });
                    } else {
                        for (let k = 0; k < results.length && k < 10; k++) {
                            let list = {
                                "admin": results[k].admin,
                                "user_id": results[k].user_id,
                                "request_count": results[k].request_count,
                                "request_status": results[k].request_status
                            };
                            bot.sendMessage(chatId, "Уровень доступа: <b>" + list.admin + "</b> \nID: <b>" + list.user_id +
                            "</b> \nСтатус запроса: <b>" + list.request_status + "</b>", {parse_mode: "HTML"});
                        }
                    }
                }

            });
            connection.release();
            if (error) {
                bot.sendMessage(chatId, "Пользователей в базе данных нету.", {
                    parse_mode: "HTML"
                });
            }
        });

    } catch (err) {
        bot.sendMessage(chatId, "Пользователей в базе данных нету.", {
            parse_mode: "HTML"
        });
    }
}

function set_userStatus(msg, userId, status) {
    let chatId = msg.chat.id;
    try {
        let sql4 = "UPDATE users SET request_status = '" + status +"' WHERE user_id = '" + userId + "'";
        pool.getConnection(function (error, connection) {
            connection.query(sql4, function (err, results) {
                if (err) {
                    // bot.sendMessage(chatId, "Что то пошло не так.");
                    return false;
                } else {
                    // bot.sendMessage(chatId, "Статус успешно изменен.");
                    return true;
                }

            });
            connection.release();
            if (error) {
                // bot.sendMessage(chatId, "Что то пошло не так.");
            }
        });

    } catch (err) {
        // bot.sendMessage(chatId, "Что то пошло не так.");
    }
}

function adminFilter(userId, callback){
    let sql4 = "SELECT * FROM users WHERE user_id = '" + userId + "'";
    pool.getConnection(function (error, connection) {
        connection.query(sql4, function (err, results) {
            if (err) {
                return false;
            } else {
                if (results.length == 0) {
                    return false;
                } else {
                    let list = {
                        "admin": results[0].admin,
                        "user_id": results[0].user_id,
                        "request_count": results[0].request_count,
                        "request_status": results[0].request_status
                    };
                    if (list.admin == "Админ"){
                        callback(list);
                    } else {
                    }
                }
            }
        });
    });
}
function workerFilter(userId, callback){
    let sql4 = "SELECT * FROM users WHERE user_id = '" + userId + "'";
    pool.getConnection(function (error, connection) {
        connection.query(sql4, function (err, results) {
            if (err) {
                return false;
            } else {
                if (results.length == 0) {
                    return false;
                } else {
                    let list = {
                        "admin": results[0].admin,
                        "user_id": results[0].user_id,
                        "request_count": results[0].request_count,
                        "request_status": results[0].request_status
                    };
                    if (list.admin == "Работник" || list.admin == "Админ"){
                        callback(list);
                    } else {
                    }
                }
            }
        });
    });
}

function set_userAdmin(msg, userId) {
    let chatId = msg.chat.id;
        try {
            let sql5 = "UPDATE users SET admin = 'Работник' WHERE user_id = '" + userId + "'";
            pool.getConnection(function (error, connection) {
                connection.query(sql5, function (err, results) {
                    if (err) {
                        bot.sendMessage(chatId, "Что то пошло не так.");
                        return false;
                    } else {
                        bot.sendMessage(chatId, "Пользователю ID: " + userId + " успешно выданы права доступа.");
                        return true;
                    }

                });
                connection.release();
                if (error) {
                    bot.sendMessage(chatId, "Что то пошло не так.");
                }
            });

        } catch (err) {
            bot.sendMessage(chatId, "Что то пошло не так.");
        }
}

function buttons(chatId, userInput, coll, page, allPages) {
    var txtData = chatId + "--" + userInput + "--" + coll + "--";

    function nullFunc() {
        return true;
    }
    if (allPages > 1) {
        if (page == 1) {

            var resultButtons = {
                parse_mode: 'HTML',
                caption: "",
                reply_markup: JSON.stringify({
                    inline_keyboard: [
                        [{
                            text: 'Следующая страница',
                            callback_data: txtData + (+page + 1),
                        }]
                    ]
                })
            };
        } else if (page == allPages) {

            var resultButtons = {
                parse_mode: 'HTML',
                reply_markup: JSON.stringify({
                    inline_keyboard: [
                        [{
                            text: 'Предыдущая страница',
                            callback_data: txtData + (+page - 1),

                        }]
                    ]
                })
            };
        } else {
            var resultButtons = {
                parse_mode: 'HTML',
                reply_markup: JSON.stringify({
                    inline_keyboard: [
                        [{
                            text: 'Предыдущая страница',
                            callback_data: txtData + (+page - 1),
                        }],
                        [{
                            text: 'Следующая страница',
                            callback_data: txtData + (+page + 1),
                        }]
                    ]
                })
            };
        }
    } else {
        var resultButtons = {
            parse_mode: 'HTML'
        };
    }
    sendTime(0.02, chatId, "Страница " + page + " из " + allPages, {});
    return resultButtons;
}

function getFromBD(chatId, userInput, coll, page) {
    var message, filter = coll;
    if (coll == "counter_id") {
        message = "Счетчика с номером ";
    } else if (coll == "number_plomb") {
        message = "Счетчика с номером пломбы ";
    } else if (coll == "owner") {
        message = "Счетчика с владельцем ";
    } else if (coll == "number_calc") {
        message = "Счетчика с расчетным счетом ";
    }
    // var userId = msg.from.id;
    try {
        // var sql4 = "SELECT * FROM countersInfo WHERE " + coll + " LIKE '%" + match[1] + "%'" + ' LIMIT ' + page + ', ' + (page+10);
        var sql4 = "SELECT * FROM countersInfo WHERE " + coll + " LIKE '%" + userInput + "%'" + ' ORDER BY ' + filter;
        pool.getConnection(function (error, connection) {
            connection.query(sql4, function (err, results) {
                var allPages = Math.ceil(results.length / 10);
                if (results.slice((page - 1) * 10).length > 9) {
                    results = results.slice((page - 1) * 10, page * 10 + 9);
                } else {
                    results = results.slice((page - 1) * 10);
                }
                if (err) {
                    bot.sendMessage(chatId, message + userInput + " в базе данных нету.");
                } else {
                    if (results.length == 0) {
                        bot.sendMessage(chatId, message + "<b>" + userInput + "</b> в базе данных нету.", {
                            parse_mode: "HTML"
                        });
                    } else {
                        for (var k = 0; k < results.length && k < 10; k++) {
                            var countersInfoMessage = "<b>Номер счетчика:</b> " + results[k].counter_id + " \n<b>Расчетный счет:</b> " + results[k].number_calc +
                                "\n<b>Номер пломбы:</b> " + results[k].number_plomb + " \n<b>Владелец:</b> " + results[k].owner + "\n<b>Адрес:</b> " + results[k].adress +
                                "\n<b>Объект:</b> " + results[k].object + "\n<b>Тип счетчика:</b> " + results[k].type + "\n<b>Мощность:</b> " + results[k].power +
                                "\n<b>Телефон:</b> " + results[k].phone + "\n<b>Комментарий:</b> ";

                            if (k == results.length - 1 && results.length < 11 || k == 9 && results.length > 10) {
                                var buttonsOptions = buttons(chatId, userInput, coll, page, allPages);
                                sendTime(0.02, chatId, countersInfoMessage, buttonsOptions);

                            } else {
                                buttonsOptions = {
                                    parse_mode: 'HTML'
                                };
                                bot.sendMessage(chatId, countersInfoMessage, buttonsOptions);
                            }
                            // bot.sendMessage(chatId, JSON.stringify(buttonsOptions) + " ", buttonsOptions);


                        }
                    }
                }

            });
            connection.release();
            if (error) {
                bot.sendMessage(chatId, message + userInput + " в базе данных нету.");
            }
        });

    } catch (err) {
        bot.sendMessage(chatId, message + userInput + " в базе данных нету.");
    }
}


bot.on('callback_query', function (callbackQuery) {
    const message = callbackQuery.message;
    const txtData = callbackQuery.data.split("--");
    // bot.sendMessage(message.chat.id, text);
    // var txtData = chatId + "_" + userInput + "_" + coll + "_" + (page+1);
    var chatId = txtData[0],
        userInput = txtData[1],
        coll = txtData[2],
        page = txtData[3];

    getFromBD(chatId, userInput, coll, page);
});
//Команды админа
bot.on('document', function (msg) {
    try{
    let fileID = msg.document.file_id;
    let file = bot.getFile(fileID);
    var extension;
    file.then(function (result) {
        extension = result.file_path.split(".")[result.file_path.split(".").length - 1];

        if (extension == "csv") {
            bot.sendMessage(msg.chat.id, "Пробую загрузить новый данные в базу...");

            const fileStream = bot.getFileStream(fileID);
            var csvData = [];
            var csvStream = fastcsv
                .parse({
                    delimiter: ';'
                })
                .on("data", function (data) {
                    csvData.push(data);
                })
                .on("end", function () {
                    // remove the first line: headergo
                    csvData.shift();

                    var query = "INSERT INTO countersinfo (counter_id, number_calc, number_plomb, owner, adress, object, type, power, phone, message) VALUES ?";
                    pool.getConnection(function (err, connection) {
                        connection.query(query, [csvData], function (error, response) {
                            if (!error) {
                                bot.sendMessage(msg.chat.id, "Данные успешно загружены!");
                            } else {
                                const how_saveExcel = {
                                    reply_markup: {
                                        inline_keyboard: [
                                            [{
                                                text: 'Как правильно сохранить файл Excel для импорта в базу.',
                                                callback_data: 'saveGide'
                                            }]
                                        ]
                                    }
                                };
                                bot.sendMessage(msg.chat.id, "Во время загрузки произошла ошибка, возможно вы не верно сохранили файл в Excel.", how_saveExcel);
                                bot.on("callback_query", function onCallbackQuery(callbackQuery) {
                                    bot.sendPhoto(msg.chat.id, "https://github.com/SmKostya/InfoBot/blob/master/img/gideSaveFileInCSV.jpg?raw=true");
                                    bot.sendMessage(msg.chat.id, "Файл -> Сохранить как -> Тип файла -> CSV(разделители - запятые)");
                                });
                            }
                        });
                        connection.release();
                    });


                });
            fileStream.pipe(csvStream);
            next();
        } else {
            bot.sendMessage(msg.chat.id, "." + extension);
        }
    });
}
catch(err){
    bot.sendMessage(msg.chat.id, "Что-то пошло не так." + err);
}
});


bot.onText(/(.+)/, function (msg, match) {
    let text = match[0];
    var chatId = msg.chat.id;
    let commands = ["/start", "тест", "Владелец", "showUsers","Номер счетчика","Номер пломбы","Расчетный счет","Помощь",
    "Очистить базу счетчиков", "Очистить базу пользователей", "/myID","Дать базовые права доступа.",
    "админ", "Админ","Admin","admin","/help","/Help","help","Help","помощь","/Помощь","/помощь",
    ];
    let keyboards = ["Владелец", "Номер счетчика", "Номер пломбы", "Расчетный счет", "Дать базовые права доступа."
    ];
    if (!commands.includes(text)){
        get_user(msg.from.id,function(list){
            let status = list.request_status;

            switch(status){
                case "-":
                    bot.sendMessage(chatId, "Сначала выберите что искать.", menu);
                    break; 
                case "Владелец":
                    workerFilter(msg.from.id, function(){
                        getFromBD(msg.chat.id, text, "owner", 1);
                    });
                    set_userStatus(msg, msg.from.id, "-");
                    break;
                case "Номер счетчика":
                    workerFilter(msg.from.id, function(){
                        getFromBD(msg.chat.id, text, "counter_id", 1);
                    });
                    set_userStatus(msg, msg.from.id, "-");
                    break;
                    
                case "Номер пломбы":
                    workerFilter(msg.from.id, function(){
                        getFromBD(msg.chat.id, text, "number_plomb", 1);
                    });
                    set_userStatus(msg, msg.from.id, "-");
                    break; 
                    
                case "Расчетный счет":
                    workerFilter(msg.from.id, function(){
                        getFromBD(msg.chat.id, text, "number_calc", 1);
                    });
                    set_userStatus(msg, msg.from.id, "-");
                    break; 
                case "Дать базовые права доступа.":
                    adminFilter(msg.from.id, function(){
                        set_userAdmin(msg, text);
                    });
                    set_userStatus(msg, msg.from.id, "-");
                    break; 
                default:
                    // bot.sendMessage(chatId, "Нема такого"); 
                    break;
            }

        });
    } else if(keyboards.includes(text)){
        set_userStatus(msg, msg.from.id, text);
        switch(text){
            case "Номер счетчика":
                bot.sendMessage(chatId, "Введите номер счетчика.");
                break;
             
            case "Номер пломбы":
                bot.sendMessage(chatId, "Введите номер пломбы.");
                break; 
             
            case "Расчетный счет":
                bot.sendMessage(chatId, "Введите расчетный счет.");
                break; 
                
            case "Владелец":
                bot.sendMessage(chatId, "Введите что-то из ФИО владельца.");
                break;
            case "Дать базовые права доступа.":
                bot.sendMessage(chatId, "Введите id пользователя которому выдать права доступа.");
                break;
            default:
                // bot.sendMessage(chatId, "Нема такого"); 
                break;
        }
    }
});

bot.onText(/Очистить базу счетчиков/, function (msg) {
    var chatId = msg.chat.id;
    try {adminFilter(msg.from.id, function(){turncate_counters_db(msg);});
    } catch (err) {}
});

bot.onText(/Очистить базу пользователей/, function (msg) {
    try {
        adminFilter(msg.from.id, function(){turncate_users_db(msg);});
    } catch (err) {
    }
});
bot.onText(/\/myID/, function (msg) {
    bot.sendMessage(msg.chat.id, "Ваш ID:" + msg.from.id);
});
bot.onText(/admin/, function (msg) {
    var chatId = msg.chat.id;
    try {
        adminFilter(msg.from.id, function(){
            bot.sendMessage(chatId, "Меню администратора включено", adminMenu);
        });
    } catch (err) {}
});
// bot.onText(/addCounterDB/, function (msg) {
//     var chatId = msg.chat.id;
//     try {
//         create_counters_db(chatId);
//     } catch (err) {}
// });
// bot.onText(/deleteCounterDB/, function (msg) {
//     var chatId = msg.chat.id;
//     try {
//         delete_counters_db(chatId);
//     } catch (err) {}
// });
// bot.onText(/addUsersDB/, function (msg) {
//     var chatId = msg.chat.id;
//     try {
//         create_users_db(chatId);
//     } catch (err) {}
// });
// bot.onText(/deleteUsersDB/, function (msg) {
//     var chatId = msg.chat.id;
//     try {
//         delete_users_db(chatId);
//     } catch (err) {}
// });
// bot.onText(/clearCounters/, function (msg) {
//     var chatId = msg.chat.id;
//     try {
//         turncate_counters_db(chatId);
//     } catch (err) {}
// });
// bot.onText(/clearUsers/, function (msg) {
//     var chatId = msg.chat.id;
//     try {
//         turncate_users_db(msg);
//     } catch (err) {}
// });

// bot.onText(/setStatus (.+)__(.+)/, function (msg, match) {
//     var userId = match[1], status = match[2];
//     set_userStatus(msg, userId, status);
// });

// bot.onText(/setAdmin (.+)/, function (msg, match) {
//     var userId = match[1];
//     set_userAdmin(msg, userId);
// });


bot.onText(/showUsers/, function (msg, match) {
    get_allUsers(msg.chat.id);
});

// bot.onText(/showUser (.+)/, function (msg, match) {
//     show_user(msg, match[1]);
// });


// Нуждаются в доработке
bot.onText(/\/start/, function (msg) {
    var newUser = {
        "user_id": msg.from.id,
        "request_status": "-",
        "request_count": "0",
        "admin": "-"
    };
    add_user(newUser);
    bot.sendMessage(msg.chat.id, helpMessage, menu);
});









//Разработка
bot.on("photo", function (msg) {
    try {
        var photoId = msg.photo[msg.photo.length - 1].file_id;
        const file = bot.getFile(photoId);

        file.then(function (result) {
            console.log(result);
        });
    } catch (err) {
        console.log(err);
    }
});






let helpMessage = "С помощью этого справочника вы сможете найти данные по нужному счетчику.\n" +
"Выберите параметр для поиска и введите искомое значение.\n" +
"Запрос в поиске можно писать не полностью и не с начала.";

bot.onText(/помощь/, function (msg) {
    bot.sendMessage(msg.chat.id, helpMessage, menu);
});
bot.onText(/\/помощь/, function (msg) {
   bot.sendMessage(msg.chat.id, helpMessage, menu);
});
bot.onText(/\/Помощь/, function (msg) {
   bot.sendMessage(msg.chat.id, helpMessage, menu);
});
bot.onText(/\/Help/, function (msg) {
   bot.sendMessage(msg.chat.id, helpMessage, menu);
});
bot.onText(/\/help/, function (msg) {
   bot.sendMessage(msg.chat.id, helpMessage, menu);
});
bot.onText(/Помощь/, function (msg) {
   bot.sendMessage(msg.chat.id, helpMessage, menu);
});
bot.onText(/Help/, function (msg) {
   bot.sendMessage(msg.chat.id, helpMessage, menu);
});







bot.onText(/Admin/, function (msg) {
    var chatId = msg.chat.id;
    try {
        adminFilter(msg.from.id, function(){
            bot.sendMessage(chatId, "Меню администратора включено", adminMenu);
        });
    } catch (err) {}
});
bot.onText(/Админ/, function (msg) {
    var chatId = msg.chat.id;
    try {
        adminFilter(msg.from.id, function(){
            bot.sendMessage(chatId, "Меню администратора включено", adminMenu);
        });
    } catch (err) {}
});
bot.onText(/админ/, function (msg) {
    var chatId = msg.chat.id;
    try {
        adminFilter(msg.from.id, function(){
            bot.sendMessage(chatId, "Меню администратора включено", adminMenu);
        });
    } catch (err) {}
});