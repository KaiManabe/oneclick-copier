/* ---------------------------------------------------------
 Type definitions
--------------------------------------------------------- */
/**
 * @typedef {Object} CopierButton
 * @property {string} label
 * @property {string} value
 */

/**
 * @typedef {Object} TableData
 * @property {number} rows
 * @property {number} columns
 * @property {CopierButton[][]} data
 */


/* ---------------------------------------------------------
 Global variables
--------------------------------------------------------- */
/**
 * @type {TableData} 
 * コピー対象の語彙を定義する
*/
let g_dict = {
    "rows": 1,
    "columns": 1,
    "data": [
        [
            {"label": "右クリックで編集", "value": ""}
        ]
    ]
};

/* ---------------------------------------------------------
 Function definitons
--------------------------------------------------------- */
/**
 * 余分なボタン行，列を削除する
 */
function trimDict(){
    // ------------------------ 空白行検査 ------------------------
    let rowsToDrop = []
    for(let i = 0; i < g_dict["rows"]; ++i){
        let empty = true;
        g_dict["data"][i].forEach((e)=>{
            if(e["label"] != undefined) empty = false;
        });
        if(empty) rowsToDrop.push(i);
    }
    for(let i = rowsToDrop.length - 1; i >= 0; --i){
        g_dict["data"].splice(rowsToDrop[i],1);
        g_dict["rows"] -= 1;
    }

    // ------------------------ 空白列検査 ------------------------
    let columnsToDrop = []
    for(let ii = 0; ii < g_dict["columns"]; ++ii){
        let empty = true;
        for(let i = 0; i < g_dict["rows"]; ++i){
            if(g_dict["data"][i][ii]["label"] != undefined) empty = false;
        }
        if(empty) columnsToDrop.push(ii);
    }

    for(let ii = columnsToDrop.length - 1; ii >= 0; --ii){
        for(let i = 0; i < g_dict["rows"]; ++i){
            g_dict["data"][i].splice(columnsToDrop[ii],1);
        }
        g_dict["columns"] -= 1;
    }
}


/**
 * 与えられた辞書をもとに，ボタンを並べたテーブルを生成
 */
function generateTable(){
    // -------------------- 一度テーブルを削除 --------------------
    const table = document.querySelector("#buttons");
    let tbody = document.querySelector("#buttons>tbody");
    tbody.remove();
    tbody = document.createElement("tbody");
    table.appendChild(tbody);

    // -------------------- 空白行，空白列を削除 --------------------
    trimDict(); 

    // ----------------------- ボタンを生成 -----------------------
    for(let i = 0; i < g_dict["rows"]; ++i){
        const tr = document.createElement("tr");
        tbody.appendChild(tr);
        for(let ii = 0; ii < g_dict["columns"]; ++ii){
            // ------------------------- 要素生成 -------------------------
            const td = document.createElement("td");                // セル
            const label = document.createElement("span");           // ボタンラベル
            const inputLabel = document.createElement("input");     // 編集モードで表示されるテキストボックス
            const inputValue = document.createElement("textarea");  // 編集モードで表示されるテキストボックス

            // ------------------------ クラス付与 ------------------------
            td.classList.add("button");
            label.classList.add("button-label");
            inputLabel.classList.add("input-label");
            inputValue.classList.add("input-value");

            // ----------------------- 親子関係設定 -----------------------
            td.appendChild(label);
            td.appendChild(inputLabel);
            td.appendChild(inputValue);
            tr.appendChild(td);

            // ------------------------- 属性設定 -------------------------
            inputLabel.placeholder = "ボタンのラベル";
            inputValue.placeholder = "コピーされるテキスト";
            td.style.width = `calc(${100 / g_dict["columns"]}vw - 2em)`;
            td.id = `r${i}c${ii}`;


            // --------------------- g_dictから値設定 ---------------------
            if(g_dict["data"][i][ii]["label"] === undefined){
                td.classList.add("empty");
                label.innerHTML = "+";
            }else{
                label.textContent = g_dict["data"][i][ii]["label"];
                inputLabel.value = g_dict["data"][i][ii]["label"];
                inputValue.value = g_dict["data"][i][ii]["value"];
            }


            // --------------------- クリックでコピー ---------------------
            td.addEventListener(
                "click", 
                ()=>{
                    onClicked(i, ii);
                }
            );

            // --------------------- 右クリックで編集 ---------------------
            td.addEventListener(
                "contextmenu",
                (e)=>{
                    e.preventDefault();
                    editMode(i, ii);
                }
            );
        }
    }
}


/**
 * ボタンがクリックされたときのコールバック
 * 
 * @param {number} row ボタンの行インデックス
 * @param {number} col ボタンの列インデックス
 */
function onClicked(row, col){
    // -------------------- 色をトランジション --------------------
    const ele = document.querySelector(`#r${row}c${col}`);
    if(ele.classList.contains("editing")) return;
    ele.classList.add("clicked");

    setTimeout(()=>{
        ele.classList.remove("clicked");
    }, 500);

    // ---------- 末初期化なら編集モード，初期化済みならコピー ----------
    if(ele.classList.contains("empty")){
        editMode(row,col);
    }else{
        navigator.clipboard.writeText(g_dict["data"][row][col]["value"]);
    }
}


/**
 * 指定されたボタンを編集モードに移行
 * @param {number} row 
 * @param {number} col 
 * @returns undefined
 */
function editMode(row, col){
    if(document.querySelectorAll(".editing").length > 0) return;
    document.querySelector(`#r${row}c${col}`).classList.add("editing");
}



/**
 * 編集中に編集中のボタン以外がクリックされたら編集を適用
 * @param {*} event 
 */
function unfocus(event){
    // -------- クリックされたのが編集中のボタンであればreturn --------
    const editing = document.querySelectorAll(".editing");
    if(editing.length == 0) return;
    let prevent = false;
    editing.forEach((e)=>{
        if(e.contains(event.target)){
            prevent = true;
            return;
        }
    });
    if(prevent) return;

    // ------------------------ 編集を確定 ------------------------
    const regex = /^r([0-9]+)c([0-9]+)/;
    editing.forEach((e)=>{
        const capture = e.id.match(regex);
        const row = parseInt(capture[1]);
        const col = parseInt(capture[2]);

        const label = e.querySelector(".input-label").value;
        const value = e.querySelector(".input-value").value;

        if(label.trim().length == 0 && value.trim().length == 0){
            g_dict["data"][row][col] = {};
            return;
        }

        g_dict["data"][row][col]["label"] = label;
        g_dict["data"][row][col]["value"] = value;
    });

    // ---------------------- テーブル再生成 ----------------------
    generateTable();
}


/**
 * 辞書JSONを読み込み
 */
function loadDict(){
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';

    input.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                g_dict = JSON.parse(event.target.result);
                generateTable();
            } catch (err) {
                alert("無効な辞書ファイル");
            }
        };
        reader.readAsText(file);
    };

    input.click();
}


/**
 * 現在のボタン設定をJSONとして保存
 */
function saveDict(){
    const jsonString = JSON.stringify(g_dict, null, 4);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'oneclick-copier.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}


/**
 * ボタン行を追加する
 */
function addRow(){
    g_dict["rows"] += 1;
    const newRow = [];
    for(let i = 0; i < g_dict["columns"]; ++i){
        newRow.push({});
    }
    g_dict["data"].push(newRow);
    g_dict["data"][g_dict["rows"] - 1][0] = {"label": "右クリックで編集", "value": ""};
    generateTable();
}


/**
 * ボタン列を追加する
 */
function addColumn(){
    g_dict["columns"] += 1;
    for(let i = 0; i < g_dict["rows"]; ++i){
        g_dict["data"][i].push({});
    }
    g_dict["data"][0][g_dict["columns"] - 1] = {"label": "右クリックで編集", "value": ""};
    generateTable();
}


/* ---------------------------------------------------------
 onload
--------------------------------------------------------- */
window.addEventListener("load", ()=>{
    document.querySelector("#load-button").addEventListener("click", loadDict);
    document.querySelector("#save-button").addEventListener("click", saveDict);
    document.querySelector("#add-row-button").addEventListener("click", addRow);
    document.querySelector("#add-column-button").addEventListener("click", addColumn);
    document.querySelector("body").addEventListener("click", (e)=>{unfocus(e);});

    generateTable();
});