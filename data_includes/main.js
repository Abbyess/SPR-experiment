PennController.ResetPrefix(null); // Shorten command names (keep this line here))

// DebugOff()   // Uncomment this line only when you are 100% done designing your experiment

const voucher = b64_md5((Date.now() + Math.random()).toString()); // Voucher code generator

// Optionally Inject a question into a trial
const askQuestion = (successCallback, failureCallback, waitTime) => (row) => (row.QUESTION=="1" ? [
  newText( "answer_correct" , row.CORRECT ),
  newText( "answer_wrong" , row.WRONG ),

  newCanvas("Canvas", 800, 150)
    .center()
    .add(   0 ,  0,  newText("この文は文法的に正しいと思いますか？").css("font-size", "22px").css("font-weight", "bold").css("color", "#36648B"))
    .add(   0 , 70 , newText("1 =").css("font-size", "20px").css("font-weight", "bold") )
    .add( 400 , 70 , newText("2 =").css("font-size", "20px").css("font-weight", "bold") )
    .add(  60 , 70 , getText("answer_correct").css("font-size", "20px") )
    .add( 460 , 70 , getText("answer_wrong").css("font-size", "20px") )
    .css("background-color", "#f0f8ff")
    .css("border-radius", "10px")
    .css("padding", "20px")
    .css("border", "1px solid #4682B4")
    .print()
  ,
  // Shuffle the position of the answers. Answer keys are 1 for left and 2 for right
  newSelector("answer")
    .add( getText("answer_correct") , getText("answer_wrong") )
    .shuffle()
    .keys("1","2")
    .log()
    .print()
    .once()
    .wait()
    .test.selected( "answer_correct" )
    .success.apply(null, successCallback().concat(
        [getText("answer_correct").css("border-bottom", "3px solid #4CAF50").css("color", "#4CAF50").css("font-weight", "bold")]
    ))
    .failure.apply(null, failureCallback().concat(
        [getText("answer_wrong").css("border-bottom", "3px solid #F44336").css("color", "#F44336").css("font-weight", "bold")]
    )),

  // Wait for feedback and to display which option was selected
  newTimer("wait", waitTime)
    .start()
    .wait()
] : []);

const askExerciseQuestion = askQuestion(
  () => [newText("<b>正解です！</b>").css("font-size", "22px").color("#4CAF50").center().print()],
  () => [newText("<b>残念ながら間違いです！</b>").css("font-size", "22px").color("#F44336").center().print()],
  1500
);

const askTrialQuestion = askQuestion(
  () => [getVar("ACCURACY").set(v=>[...v,true])],
  () => [
    getVar("ACCURACY").set(v=>[...v,false]),
    newText("<b>残念ながら間違いです！</b>")
      .css("font-size", "22px")
      .color("#F44336")
      .center()
      .print(),
    // need to repeat the css code, unfortunately, because of the time that follows
    getText("answer_wrong").css("border-bottom", "3px solid #F44336").css("color", "#F44336").css("font-weight", "bold"),
    // Penalty for the wrong answer is waiting 1000 ms before continuing
    newTimer("wait", 1500)
      .start()
      .wait()
  ],
  500
);

// display a primer that can be clicked away by pressing space bar
const newPrimer = () => [
  newText('primer','*')
    .css("font-size", "50pt")
    .css("margin-top", "20px")
    .css("margin-bottom", "20px")
    .css("color", "#4682B4")
    .css("text-align", "center")
    .center()
    .print(),
  newKey(" ").wait(),
  getText('primer').remove(),
];

Header(
    // Declare global variables to store the participant's ID and demographic information
    newVar("ID").global(),
    newVar("JAPANESE").global(),
    newVar("PREFECTURE").global(),
    newVar("NATIVE").global(),
    newVar("AGE").global(),
    newVar("GENDER").global(),
    newVar("HAND").global(),
    newVar("ACCURACY", []).global()
)
 // Add the particimant info to all trials' results lines
.log( "id"     , getVar("ID") )
.log( "japanese" , getVar("JAPANESE") )
.log( "prefecture"   , getVar("PREFECTURE") )
.log( "native" , getVar("NATIVE") )
.log( "age"    , getVar("AGE") )
.log( "gender" , getVar("GENDER") )
.log( "hand"   , getVar("HAND") )
.log( "code"   , voucher );

// Sequence of events: consent to ethics statement required to start the experiment, participant information, instructions, exercise, transition screen, main experiment, result logging, and end screen.
 Sequence("ethics", "setcounter", "participants", "instructions", randomize("exercise"), "start_experiment", rshuffle("experiment-filler", "experiment-item"), SendResults(), "end")

// Ethics agreement: participants must agree before continuing
newTrial("ethics",
    newHtml("ethics_explanation", "ethics.html")
        .cssContainer({"margin":"2em", "line-height": "1.5"})
        .print()
    ,
newHtml("form", `<div class='fancy'><input name='consent' id='consent' type='checkbox'><label for='consent'>私は少なくとも18歳であり、研究に参加することに同意します。参加者情報を読み、理解しました。私の参加は自発的なものです。いつでも理由を述べることなく研究参加を中止できることを理解しており、それによる不利益はありません。研究の過程で記録されたデータが匿名化された形で使用されることに同意します。</label></div>`)
        .cssContainer({"margin":"2em", "font-size": "18px", "line-height": "1.5"})
        .print()
    ,
    newFunction( () => $("#consent").change( e=>{
        if (e.target.checked) getButton("go_to_info").enable()._runPromises();
        else getButton("go_to_info").disable()._runPromises();
    }) ).call()
    ,
    newButton("go_to_info", "実験を開始する")
        .cssContainer({"margin":"2em", "font-size": "18px"})
        .disable()
        .print()
        .wait()
);

// Start the next list as soon as the participant agrees to the ethics statement
// This is different from PCIbex's normal behavior, which is to move to the next list once 
// the experiment is completed. In my experiment, multiple participants are likely to start 
// the experiment at the same time, leading to a disproportionate assignment of participants
// to lists.
SetCounter("setcounter");

// Participant information: questions appear as soon as information is input
newTrial("participants",
    defaultText
        .cssContainer({"margin-top":"1.5em", "margin-bottom":"1.5em", "font-size": "18px"})
        .print()
    ,
    newText("participant_info_header", "<div class='fancy'><h2>結果を分析するために、以下の情報が必要です。</h2><p style='font-size: 18px; line-height: 1.5;'>すべての情報は匿名で扱われ、後からあなたを特定することはできません。</p></div>")
    ,
    // Participant ID (6-place)
    newText("participantID", "<b>参加者IDを入力してください。</b><br>(Enterキーで確定してください)")
    ,
    newTextInput("input_ID")
        .length(6)
        .css("font-size", "18px")
        .css("padding", "8px")
        .css("border", "1px solid #ccc")
        .css("border-radius", "4px")
        .css("width", "200px")
        .log()
        .print()
        .wait()
    ,
    // Japanese native speaker question
    newText("<b>日本語は母国語ですか？</b>")
    ,
    newScale("input_japanese",   "はい", "いいえ")
        .radio()
        .css("font-size", "18px")
        .css("line-height", "1.5")
        .log()
        .labelsPosition("right")
        .print()
        .wait()
    ,
    // Prefecture of origin
    newText("<b>どの都道府県出身ですか？</b>")
    ,
    newDropDown("prefecture", "(選択してください)")
        .add("北海道", "青森県", "岩手県", "宮城県", "秋田県", "山形県", "福島県", "茨城県", "栃木県", "群馬県", "埼玉県", "千葉県", "東京都", "神奈川県", "新潟県", "富山県", "石川県", "福井県", "山梨県", "長野県", "岐阜県", "静岡県", "愛知県", "三重県", "滋賀県", "京都府", "大阪府", "兵庫県", "奈良県", "和歌山県", "鳥取県", "島根県", "岡山県", "広島県", "山口県", "徳島県", "香川県", "愛媛県", "高知県", "福岡県", "佐賀県", "長崎県", "熊本県", "大分県", "宮崎県", "鹿児島県", "沖縄県", "日本以外")
        .css("font-size", "18px")
        .css("padding", "8px")
        .css("border", "1px solid #ccc")
        .css("border-radius", "4px")
        .css("background-color", "white")
        .log()
        .print()
        .wait()
    ,
    // Other native languages
    newText("<b>他に母国語はありますか？</b><br>(Enterキーで確定してください)")
    ,
    newTextInput("input_native")
        .css("font-size", "18px")
        .css("padding", "8px")
        .css("border", "1px solid #ccc")
        .css("border-radius", "4px")
        .css("width", "300px")
        .log()
        .print()
        .wait()
    ,
    // Age
    newText("<b>年齢</b><br>(Enterキーで確定してください)")
    ,
    newTextInput("input_age")
        .length(2)
        .css("font-size", "18px")
        .css("padding", "8px")
        .css("border", "1px solid #ccc")
        .css("border-radius", "4px")
        .css("width", "80px")
        .log()
        .print()
        .wait()
    ,
    // Gender
    newText("<b>性別</b>")
    ,
    newScale("input_gender",   "女性", "男性", "その他")
        .radio()
        .css("font-size", "18px")
        .css("line-height", "1.5")
        .log()
        .labelsPosition("right")
        .print()
        .wait()
    ,
    // Handedness
    newText("<b>利き手</b>")
    ,
    newScale("input_hand",   "右", "左", "両方")
        .radio()
        .css("font-size", "18px")
        .css("line-height", "1.5")
        .log()
        .labelsPosition("right")
        .print()
        .wait()
    ,
    // Clear error messages if the participant changes the input
    newKey("just for callback", "") 
        .callback( getText("errorage").remove() , getText("errorID").remove() )
    ,
    // Formatting text for error messages
    defaultText.color("#F44336").print()
    ,
    // Continue. Only validate a click when ID and age information is input properly
    newButton("weiter", "指示へ進む")
        .cssContainer({"margin-top":"2em", "margin-bottom":"2em", "font-size": "18px"})
        .print()
        // Check for participant ID and age input
        .wait(
             newFunction('dummy', ()=>true).test.is(true)
            // ID
            .and( getTextInput("input_ID").testNot.text("")
                .failure( newText('errorID', "参加者IDを入力してください。これはメールで受け取ったものです。").css("font-size", "16px") )
            // Age
            ).and( getTextInput("input_age").test.text(/^\d+$/)
                .failure( newText('errorage', "年齢を入力してください。").css("font-size", "16px"), 
                          getTextInput("input_age").text("")))  
        )
    ,
    // Store the texts from inputs into the Var elements
    getVar("ID")     .set( getTextInput("input_ID") ),
    getVar("JAPANESE") .set( getScale("input_japanese") ),
    getVar("PREFECTURE")   .set( getDropDown("prefecture") ),
    getVar("NATIVE") .set( getTextInput("input_native") ),
    getVar("AGE")    .set( getTextInput("input_age") ),
    getVar("GENDER") .set( getScale("input_gender") ),
    getVar("HAND")   .set( getScale("input_hand") )
);

// Instructions
newTrial("instructions",
    newHtml("instructions_text", "instructions.html")
        .cssContainer({"margin":"2em", "line-height": "1.5"})
        .print()
        ,
    newButton("go_to_exercise", "練習を開始")
        .cssContainer({"margin":"2em", "font-size": "18px"})
        .print()
        .wait()
);

// Exercise
Template("exercise.csv", row =>
  newTrial("exercise",
           newPrimer(),
           // Dashed sentence. Segmentation is marked by "*"
           newController("DashedSentence", {
               s: row.SENTENCE, 
               mode: "self-paced reading",
               display: "dashed",
               hideUnderscores: true,
               splitRegex: /\*/
           })
           .center()
           .print()
           .log()
           .wait()
           .remove(),
           askExerciseQuestion(row))
    .log( "item"      , row.ITEM)
    .log( "condition" , row.CONDITION)
);

// Start experiment
newTrial( "start_experiment" ,
    newText("<h2>これから本実験を始めます。</h2><p style='font-size: 18px; line-height: 1.5;'>間違った回答の場合のみフィードバックが表示されます。</p>")
        .cssContainer({"margin":"2em"})
        .print()
    ,
    newButton("go_to_experiment", "実験を開始")
        .cssContainer({"margin":"2em", "font-size": "18px"})
        .print()
        .wait()
);

// Experimental trial
Template("experiment.csv", row =>
    newTrial( "experiment-"+row.TYPE,
              newPrimer(),
           // Dashed sentence. Segmentation is marked by "*"
           newController("DashedSentence", {
               s: row.SENTENCE, 
               mode: "self-paced reading",
               display: "dashed",
               hideUnderscores: true,
               splitRegex: /\*/
           })
           .center()
           .print()
           .log()
           .wait()
           .remove(),
           askTrialQuestion(row))
    .log( "list"      , row.LIST)
    .log( "item"      , row.ITEM)
    .log( "condition" , row.CONDITION)
);

// Final screen: explanation of the goal
newTrial("end",
    newText("<div class='fancy'><h2>研究にご参加いただき、ありがとうございました！</h2></div><p>謝礼を受け取るには、このコードを研究担当者に送信してください: <div class='fancy' style='padding: 20px; font-size: 22px; text-align: center;'><em>".concat(voucher, "</em></div></p>"))
        .cssContainer({"margin-top":"2em", "margin-bottom":"2em"})
        .print()
    ,

    newVar("computedAccuracy").set(getVar("ACCURACY")).set(v=>Math.round(v.filter(a=>a===true).length/v.length*100)),
    newText("accuracy").text(getVar("computedAccuracy"))
    ,
    newText("<div style='margin: 2em 0; padding: 15px; background-color: #f0f8ff; border-radius: 8px; border-left: 5px solid #4682B4; font-size: 18px;'><b>質問の正答率: </b>")
        .after(getText("accuracy").css("font-weight", "bold").css("font-size", "20px"))
        .after(newText("%</div>").css("font-size", "18px"))
        .print()
    ,
    newHtml("explain", "end.html")
        .print()
    ,
    // Trick: stay on this trial forever (until tab is closed)
    newButton().wait()
)
.setOption("countsForProgressBar",false);
