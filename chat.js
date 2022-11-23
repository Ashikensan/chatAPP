// 必要なfirebaseライブラリを読み込む
// Import the functions you need from the SDKs you need
//バージョンを要チェック！
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.1.0/firebase-app.js";
//↓に重要なコードを貼り付ける（RealtimeDatabaseを使えるよう追加でインポートしている）
//バージョンを要チェック！
import { getDatabase, ref, push, set, onChildAdded, remove,onChildRemoved,serverTimestamp} from "https://www.gstatic.com/firebasejs/9.1.0/firebase-database.js";
//auth認証のライブラリを追加
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.1.0/firebase-auth.js";

// Your web app's Firebase configuration
const firebaseConfig = {
    ///削除
    };

// Initialize Firebase
const app = initializeApp(firebaseConfig);

//GoogleAuth(認証用)ここから
const provider = new GoogleAuthProvider();
provider.addScope('https://www.googleapis.com/auth/contacts.readonly');
const auth = getAuth();
//GoogleAuth(認証用)ここまで


// <!-- firebaseのCDNから貼り付け（ここまで） -->

const clouddb = getFirestore();
// firebaseのstorage機能を追加 //
import{
    getStorage,
    ref as sRef,
    uploadBytesResumable,
    getDownloadURL,
} from"https://www.gstatic.com/firebasejs/9.1.0/firebase-storage.js"

import{
    getFirestore,
    doc,
    getDoc,
    setDoc,
    collection,
    addDoc,
} from"https://www.gstatic.com/firebasejs/9.1.0/firebase-firestore.js"

$("#login").on("click", function () {
    //Google認証完了の処理
    signInWithPopup(auth, provider).then((result) => {
            // Login後のページ遷移
            location.href = "index.html";  //遷移先次のページ
            console.log('ログインOK');
        }).catch((error) => {
          console.log('ログイン失敗');
            // Handle Errors here.
            const errorCode = error.code;
            const errorMessage = error.message;
            // The email of the user's account used.
            const email = error.email;
            // The AuthCredential type that was used.
            const credential = GoogleAuthProvider.credentialFromError(error);
            // 
        });
    });

// ---------------------------
let files = [];
let reader = new FileReader();

let namebox = document.getElementById("namebox")
let extlab = document.getElementById("extlab")
let myimg = document.getElementById("myimg")
let proglab = document.getElementById("upprogress")
let selBtn = document.getElementById("selbtn")
let UpBtn = document.getElementById("upbtn")
let DownBtn = document.getElementById("downbtn")

let input = document.createElement("input")
input.type = "file";

input.onchange = (e) => {
    files = e.target.files;

    let extention = GetFileExt(files[0])
    let name = GetFileName(files[0])

    namebox.value = name;
    extlab.innerHTML = extention

    reader.readAsDataURL(files[0]);
};

reader.onload = function () {
    myimg.src = reader.result;
};

// ------------selection----------------
selBtn.onclick = () => {
    input.click()
}

function GetFileExt (file) {
    let temp = file.name.split(".")
    let ext = temp.slice((temp.length-1),(temp.length))
    return "." + ext[0];
}

function GetFileName(file){
    let temp = file.name.split('.')
    let fname = temp.slice(0.-1).join(".");
    return fname;
}
// -----------upload---------------------
async function UploadProcess(){
    let ImgToUpload = files[0]
    let ImgName = namebox.value + extlab.innerHTML
    const metaData = {
        contentType: ImgToUpload.type
    }
    const storage = getStorage();
    const storageRef = sRef(storage, "Images/"+ImgName)
    const UploadTask = uploadBytesResumable(
        storageRef,
        ImgToUpload,
        metaData
    );
    UploadTask.on("state-changed", (snapshot) => {
        let progress = 
            (snapshot.bytesTransferred / snapshot.totalBytes)*100;
            proglab.innerHTML = "Upload" + progress + "%";
    },
    (error) => {
        alert("エラーです！アップロードできていません！");
    },
    () => {
        getDownloadURL(UploadTask.snapshot.ref).then((downloadURL)=>{
            console.log(downloadURL);
        })
    });
}
UpBtn.onclick = UploadProcess;

//------------------------------------- functions for firestore database

async function SaveURLtoFirestore(url){
    let name = namebox.value
    let ext = extlab.innerHTML

    let ref = doc(clouddb, "ImageLinks/ + name")

    await setDoc(ref, {
        ImageName: name + ext,
        ImageURL: URL,
    });
}

async function GetImagefromFirestore(){
    let name = namebox.value;
    let ref = doc(clouddb, "ImageLinks/ + name")
    const docSnap = await getDoc(ref)

    if(docSnap.exists()){
        myimg.src = docSnap.data().ImageURL
    }

}
UpBtn.onclick = UploadProcess;
DownBtn.onclick = GetImagefromFirestore;


//dbはデータベース、何かのデータを保存するのでdbと命名している
//firebaseのルール。とりあえず書く必要がある。firebaseへ接続する宣言。
const db = getDatabase(app);

//dev245はfirebaseのプロジェクト名。
const dbRef = ref(db, 'dev245');
//時間を取得
const timestamp = serverTimestamp();

//id="text"エリアのテキストをDBへ保存、ブラウザへ表示する挙動を関数executionでまとめる
const execution = () => {
    const msg = {
        uname : $("#uname").val(), //「uname」という鍵の値の名前,databaseへキーとして表示。unameの場所を取得する
        text  : $("#text").val(), //「text」という鍵の値の名前,databaseへデータとして表示。textの場所を取得する
        timestamp: serverTimestamp()
    }
    //databaseをref（参照）した場所へデータを送信できる準備（通信）をして
    const newPostRef = push(dbRef);
    //上記通信をして、変数msgで取得した情報をfirebaseへ保存する
    set(newPostRef, msg); 
    //送信後、入力欄を空にする
    $("#uname").val("");
    $("#text").val("");
    $("#text").focus("");
}

//送信ボタン押下時の送信処理
$("#send").on("click", function() {
    execution();
});

//テキストエリア内でエンターボタン押下時の送信処理
$("#text").keypress(function(e) {
    if(e.keyCode == 13){
        execution();
    }
})

//受信処理を記述、firebaseの構文を利用。
onChildAdded(dbRef, function(data) { //dbを参照して、以下を実行します。dataという引数にデータが入ってくるという決まり
    const msg = data.val(); //firebaseのデータのまとまりを取得して
    const key = data.key; //DB内のユニークキーを取得
    console.log(key);
    //時間を表示
    let now = msg.timestamp;
    let date = new Date(now); //差分のミリ秒をnewDateに入れる！調べる！一旦入れる。下準備
    //差分のミリ秒から時刻を割り戻す
    let dates = date.getFullYear() + "年" + (date.getMonth() +1) + "月" + date.getDate() + "日 " + date.getHours() + "時" + date.getMinutes() + "分"
    let h =`
        <div>
            <p>${msg.uname}</p>
            <p>${msg.text}</p>
            <p>${dates}</p>
        </div>
    `;
    $("#output").append(h);
    //表示コメントのスクロールを一番最後に常に表示させる
    const output = document.getElementById('output');
    output.scrollTo(0, output.scrollHeight);    
});
