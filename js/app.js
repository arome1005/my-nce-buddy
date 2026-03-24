const DEFAULT_BOOK_KEY = 'NCE1';
const PLAY_MODE_STORAGE_KEY = 'playMode';
const BOOK_SELECTION_STORAGE_KEY = 'selectedBookKey';

const qs = (selector, root = document) => root.querySelector(selector);
const qsa = (selector, root = document) => Array.from(root.querySelectorAll(selector));
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

class NCEDataManager {
  constructor() {
    this.books = [];
    this.currentBookKey = 'NCE1';
    this.selectedBooks = ['NCE1'];
    this.allUnits = new Map();
    this.wordDatabase = [];
    this.sentenceDatabase = [];
    this.grammarDatabase = [];
  }

  async init() {
    await this.loadBooks();
    await this.loadAllBookData();
    this.processNCEData();
  }

  async loadBooks() {
    try {
      const response = await fetch('data.json');
      const data = await response.json();
      this.books = Array.isArray(data.books) ? data.books : [];
    } catch (error) {
      console.error('加载课本数据失败:', error);
      this.books = [];
    }
    return this.books;
  }

  async loadAllBookData() {
    for (const book of this.books) {
      if (!book.bookPath) continue;
      try {
        const response = await fetch(`${book.bookPath}/book.json`);
        const data = await response.json();
        this.allUnits.set(book.key, {
          ...data,
          bookKey: book.key,
          bookTitle: book.title,
          units: data.units.map((unit, index) => ({
            ...unit,
            id: index + 1,
            audio: `${book.bookPath}/${unit.filename}.mp3`,
            lrc: `${book.bookPath}/${unit.filename}.lrc`
          }))
        });
      } catch (error) {
        console.error(`加载 ${book.title} 数据失败:`, error);
      }
    }
  }

  processNCEData() {
    this.wordDatabase = [];
    this.sentenceDatabase = [];
    this.grammarDatabase = [];

    const commonWords = {
      NCE1: [
        { word: 'excuse', phonetic: '/ɪkˈskjuːz/', meaning: 'v. 原谅；n. 借口', example: 'Excuse me!', examples: ['Excuse me!', 'Excuse me, is this your bag?', 'Please excuse me for being late.'] },
        { word: 'me', phonetic: '/miː/', meaning: 'pron. 我（宾格）', example: 'Excuse me!', examples: ['Excuse me!', 'Please give me the book.', 'Can you help me?'] },
        { word: 'yes', phonetic: '/jes/', meaning: 'adv. 是的', example: 'Yes?', examples: ['Yes?', 'Yes, that\'s right.', 'Yes, please.'] },
        { word: 'is', phonetic: '/ɪz/', meaning: 'v. 是（be的第三人称单数现在时）', example: 'Is this your pen?', examples: ['Is this your pen?', 'She is a teacher.', 'That is a nice car.'] },
        { word: 'this', phonetic: '/ðɪs/', meaning: 'pron. 这，这个', example: 'This is my book.', examples: ['This is my book.', 'This is a pen.', 'This is my house.'] },
        { word: 'your', phonetic: '/jɔː/', meaning: 'pron. 你的，你们的', example: 'Is this your pen?', examples: ['Is this your pen?', 'What is your name?', 'This is your book.'] },
        { word: 'pen', phonetic: '/pen/', meaning: 'n. 钢笔', example: 'Is this your pen?', examples: ['Is this your pen?', 'I need a pen.', 'This pen writes well.'] },
        { word: 'pencil', phonetic: '/ˈpensl/', meaning: 'n. 铅笔', example: 'That is a pencil.', examples: ['That is a pencil.', 'I draw with a pencil.', 'This is my pencil.'] },
        { word: 'book', phonetic: '/bʊk/', meaning: 'n. 书', example: 'This is a book.', examples: ['This is a book.', 'I read a book every day.', 'That is a good book.'] },
        { word: 'watch', phonetic: '/wɒtʃ/', meaning: 'n. 手表', example: 'Is this your watch?', examples: ['Is this your watch?', 'My watch is new.', 'This watch is expensive.'] },
        { word: 'coat', phonetic: '/kəʊt/', meaning: 'n. 上衣，外套', example: 'That\'s a nice coat.', examples: ['That\'s a nice coat.', 'Put on your coat.', 'This coat is warm.'] },
        { word: 'dress', phonetic: '/dres/', meaning: 'n. 连衣裙', example: 'Her dress is beautiful.', examples: ['Her dress is beautiful.', 'She wears a red dress.', 'This dress is nice.'] },
        { word: 'skirt', phonetic: '/skɜːt/', meaning: 'n. 裙子', example: 'That\'s a lovely skirt.', examples: ['That\'s a lovely skirt.', 'She likes her new skirt.', 'This skirt is blue.'] },
        { word: 'shirt', phonetic: '/ʃɜːt/', meaning: 'n. 衬衣', example: 'Is this your shirt?', examples: ['Is this your shirt?', 'This shirt is white.', 'He wears a shirt.'] },
        { word: 'car', phonetic: '/kɑː/', meaning: 'n. 小汽车', example: 'This is my car.', examples: ['This is my car.', 'That car is fast.', 'I drive a car.'] },
        { word: 'house', phonetic: '/haʊs/', meaning: 'n. 房子', example: 'That\'s a big house.', examples: ['That\'s a big house.', 'This is my house.', 'The house is new.'] },
        { word: 'please', phonetic: '/pliːz/', meaning: 'int. 请', example: 'Come in, please.', examples: ['Come in, please.', 'Sit down, please.', 'Please help me.'] },
        { word: 'here', phonetic: '/hɪə/', meaning: 'adv. 这里', example: 'Here it is.', examples: ['Here it is.', 'Come here.', 'Here is your book.'] },
        { word: 'sorry', phonetic: '/ˈsɒri/', meaning: 'adj. 对不起的', example: 'I\'m sorry.', examples: ['I\'m sorry.', 'Sorry, I\'m late.', 'I\'m sorry to hear that.'] },
        { word: 'sir', phonetic: '/sɜː/', meaning: 'n. 先生', example: 'Thank you, sir.', examples: ['Thank you, sir.', 'Yes, sir.', 'Good morning, sir.'] }
      ],
      NCE2: [
        { word: 'private', phonetic: '/ˈpraɪvət/', meaning: 'adj. 私人的', example: 'This is a private conversation.', examples: ['This is a private conversation.', 'That is a private house.', 'Please respect their private life.'] },
        { word: 'conversation', phonetic: '/ˌkɒnvəˈseɪʃən/', meaning: 'n. 谈话', example: 'I had a conversation with him.', examples: ['I had a conversation with him.', 'They are having a conversation.', 'Please join our conversation.'] },
        { word: 'theatre', phonetic: '/ˈθɪətə/', meaning: 'n. 剧场，戏院', example: 'We went to the theatre.', examples: ['We went to the theatre.', 'The theatre is full tonight.', 'I love going to the theatre.'] },
        { word: 'seat', phonetic: '/siːt/', meaning: 'n. 座位', example: 'I had a very good seat.', examples: ['I had a very good seat.', 'Please take a seat.', 'This seat is taken.'] },
        { word: 'play', phonetic: '/pleɪ/', meaning: 'n. 戏', example: 'The play was interesting.', examples: ['The play was interesting.', 'We saw a good play.', 'The play starts at 7.'] },
        { word: 'loudly', phonetic: '/ˈlaʊdli/', meaning: 'adv. 大声地', example: 'They were talking loudly.', examples: ['They were talking loudly.', 'Don\'t speak so loudly.', 'She laughed loudly.'] },
        { word: 'angry', phonetic: '/ˈæŋgri/', meaning: 'adj. 生气的', example: 'I got very angry.', examples: ['I got very angry.', 'Don\'t be angry with me.', 'He looks angry.'] },
        { word: 'attention', phonetic: '/əˈtenʃən/', meaning: 'n. 注意', example: 'Pay attention!', examples: ['Pay attention!', 'Please pay attention to the teacher.', 'He gave me his full attention.'] },
        { word: 'bear', phonetic: '/beə/', meaning: 'v. 容忍', example: 'I could not bear it.', examples: ['I could not bear it.', 'I can\'t bear this noise.', 'She bears her troubles well.'] },
        { word: 'business', phonetic: '/ˈbɪznɪs/', meaning: 'n. 事；生意', example: 'It\'s none of your business.', examples: ['It\'s none of your business.', 'He is in business.', 'Business is good this year.'] },
        { word: 'rudely', phonetic: '/ˈruːdli/', meaning: 'adv. 无礼地，粗鲁地', example: 'The young man said rudely.', examples: ['The young man said rudely.', 'Don\'t speak so rudely.', 'He behaved rudely.'] },
        { word: 'until', phonetic: '/ʌnˈtɪl/', meaning: 'prep. 直到...为止', example: 'I waited until 12 o\'clock.', examples: ['I waited until 12 o\'clock.', 'We will stay here until tomorrow.', 'He worked until late.'] },
        { word: 'outside', phonetic: '/ˌaʊtˈsaɪd/', meaning: 'adv. 外面', example: 'It was dark outside.', examples: ['It was dark outside.', 'Please wait outside.', 'The outside of the house is beautiful.'] },
        { word: 'ring', phonetic: '/rɪŋ/', meaning: 'v. （铃、电话等）响', example: 'The telephone rang.', examples: ['The telephone rang.', 'The bell is ringing.', 'Please ring the doorbell.'] },
        { word: 'aunt', phonetic: '/ɑːnt/', meaning: 'n. 姑，姨，婶，舅母', example: 'My aunt arrived.', examples: ['My aunt arrived.', 'This is my aunt.', 'My aunt lives in Beijing.'] },
        { word: 'repeat', phonetic: '/rɪˈpiːt/', meaning: 'v. 重复', example: 'Don\'t repeat that.', examples: ['Don\'t repeat that.', 'Please repeat after me.', 'Can you repeat the question?'] }
      ],
      NCE3: [
        { word: 'puma', phonetic: '/ˈpjuːmə/', meaning: 'n. 美洲狮', example: 'Pumas are large, cat-like animals.', examples: ['Pumas are large, cat-like animals.', 'The puma is a wild animal.', 'Pumas live in the Americas.'] },
        { word: 'spot', phonetic: '/spɒt/', meaning: 'v. 看出，发现', example: 'He was spotted by the police.', examples: ['He was spotted by the police.', 'I spotted a mistake.', 'Can you spot the difference?'] },
        { word: 'evidence', phonetic: '/ˈevɪdəns/', meaning: 'n. 证据', example: 'There is no evidence.', examples: ['There is no evidence.', 'We need more evidence.', 'The evidence is clear.'] },
        { word: 'accumulate', phonetic: '/əˈkjuːmjʊleɪt/', meaning: 'v. 积累，积聚', example: 'Dust accumulates quickly.', examples: ['Dust accumulates quickly.', 'We need to accumulate more data.', 'Snow accumulated overnight.'] },
        { word: 'oblige', phonetic: '/əˈblaɪdʒ/', meaning: 'v. 使...感到必须', example: 'I felt obliged to help.', examples: ['I felt obliged to help.', 'I\'m obliged to you.', 'Circumstances oblige me to act.'] },
        { word: 'hunt', phonetic: '/hʌnt/', meaning: 'n. 追猎；寻找', example: 'The hunt for the puma began.', examples: ['The hunt for the puma began.', 'They went on a hunt.', 'The hunt lasted all day.'] },
        { word: 'blackberry', phonetic: '/ˈblækbəri/', meaning: 'n. 黑莓', example: 'Blackberries are delicious.', examples: ['Blackberries are delicious.', 'I picked some blackberries.', 'Blackberry jam is tasty.'] },
        { word: 'human', phonetic: '/ˈhjuːmən/', meaning: 'n. 人类', example: 'It was a human being.', examples: ['It was a human being.', 'Human beings are intelligent.', 'This is human nature.'] },
        { word: 'corner', phonetic: '/ˈkɔːnə/', meaning: 'v. 使走投无路，使陷入困境', example: 'The escaped prisoner was cornered.', examples: ['The escaped prisoner was cornered.', 'The cat cornered the mouse.', 'Don\'t corner him.'] },
        { word: 'trail', phonetic: '/treɪl/', meaning: 'n. 一串，一系列', example: 'The trail was easy to follow.', examples: ['The trail was easy to follow.', 'There\'s a trail of breadcrumbs.', 'Follow the trail.'] },
        { word: 'print', phonetic: '/prɪnt/', meaning: 'n. 印痕', example: 'Paw prints were found.', examples: ['Paw prints were found.', 'Finger prints are unique.', 'Foot prints in the mud.'] },
        { word: 'cling', phonetic: '/klɪŋ/', meaning: 'v. 粘', example: 'The wet shirt clung to his body.', examples: ['The wet shirt clung to his body.', 'The child clung to his mother.', 'Damp clothes cling to the skin.'] },
        { word: 'convince', phonetic: '/kənˈvɪns/', meaning: 'v. 使...信服', example: 'I am convinced of his innocence.', examples: ['I am convinced of his innocence.', 'She convinced me.', 'It\'s hard to convince him.'] },
        { word: 'somehow', phonetic: '/ˈsʌmhaʊ/', meaning: 'adv. 不知怎么搞地', example: 'Somehow, I don\'t trust him.', examples: ['Somehow, I don\'t trust him.', 'We\'ll get there somehow.', 'Somehow, it worked.'] },
        { word: 'disturb', phonetic: '/dɪsˈtɜːb/', meaning: 'v. 令人不安', example: 'The news disturbed me.', examples: ['The news disturbed me.', 'Don\'t disturb him.', 'The noise disturbed my sleep.'] }
      ],
      NCE4: [
        { word: 'fossil', phonetic: '/ˈfɒsəl/', meaning: 'n. 化石', example: 'Fossils are remains of ancient life.', examples: ['Fossils are remains of ancient life.', 'We found a fossil.', 'This fossil is millions of years old.'] },
        { word: 'salty', phonetic: '/ˈsɔːlti/', meaning: 'adj. 咸的', example: 'Sea water is salty.', examples: ['Sea water is salty.', 'The soup is too salty.', 'I like salty food.'] },
        { word: 'residue', phonetic: '/ˈrezɪdjuː/', meaning: 'n. 残渣', example: 'A residue was left in the bottom.', examples: ['A residue was left in the bottom.', 'There\'s a residue.', 'Clean the residue carefully.'] },
        { word: 'magnify', phonetic: '/ˈmægnɪfaɪ/', meaning: 'v. 放大', example: 'A microscope magnifies objects.', examples: ['A microscope magnifies objects.', 'Use this lens to magnify.', 'Don\'t magnify the problem.'] },
        { word: 'microscope', phonetic: '/ˈmaɪkrəskəʊp/', meaning: 'n. 显微镜', example: 'The scientist used a microscope.', examples: ['The scientist used a microscope.', 'Look through the microscope.', 'We need a powerful microscope.'] },
        { word: 'torrent', phonetic: '/ˈtɒrənt/', meaning: 'n. 激流，洪流', example: 'The rain fell in torrents.', examples: ['The rain fell in torrents.', 'A torrent of water rushed down.', 'The river became a torrent.'] },
        { word: 'drip', phonetic: '/drɪp/', meaning: 'v. 滴', example: 'Water drips from the tap.', examples: ['Water drips from the tap.', 'The tap is dripping.', 'Drips fell from the ceiling.'] },
        { word: 'slope', phonetic: '/sləʊp/', meaning: 'n. 斜坡', example: 'The house is on a slope.', examples: ['The house is on a slope.', 'The hill has a steep slope.', 'Walk up the slope.'] },
        { word: 'treacherous', phonetic: '/ˈtretʃərəs/', meaning: 'adj. 充满危险的', example: 'The road was treacherous.', examples: ['The road was treacherous.', 'The ice is treacherous.', 'He is a treacherous man.'] },
        { word: 'contamination', phonetic: '/kənˌtæmɪˈneɪʃən/', meaning: 'n. 污染', example: 'Contamination is a serious problem.', examples: ['Contamination is a serious problem.', 'We must prevent contamination.', 'The water has contamination.'] },
        { word: 'sanitation', phonetic: '/ˌsænɪˈteɪʃən/', meaning: 'n. 卫生，卫生设备', example: 'Sanitation is important for health.', examples: ['Sanitation is important for health.', 'Improve sanitation conditions.', 'This area lacks sanitation.'] },
        { word: 'swill', phonetic: '/swɪl/', meaning: 'v. 冲洗', example: 'Please swill the dishes.', examples: ['Please swill the dishes.', 'Swill the bucket out.', 'He swilled his mouth.'] },
        { word: 'soap', phonetic: '/səʊp/', meaning: 'n. 肥皂', example: 'Wash your hands with soap.', examples: ['Wash your hands with soap.', 'I need some soap.', 'This soap smells nice.'] },
        { word: 'flavour', phonetic: '/ˈfleɪvə/', meaning: 'n. 滋味', example: 'This soup has a nice flavour.', examples: ['This soup has a nice flavour.', 'What flavour is this?', 'I love the flavour of coffee.'] },
        { word: 'ingredient', phonetic: '/ɪnˈgriːdiənt/', meaning: 'n. 配料', example: 'Flour is a basic ingredient.', examples: ['Flour is a basic ingredient.', 'List the ingredients.', 'This has many ingredients.'] }
      ]
    };

    for (const [bookKey, words] of Object.entries(commonWords)) {
      this.wordDatabase.push(...words.map(word => ({ ...word, bookKey })));
    }

    const sentences = {
      NCE1: [
        { english: 'Excuse me!', chinese: '对不起！', bookKey: 'NCE1', unit: 1 },
        { english: 'Is this your handbag?', chinese: '这是您的手提包吗？', bookKey: 'NCE1', unit: 1 },
        { english: 'Pardon?', chinese: '对不起，请再说一遍。', bookKey: 'NCE1', unit: 1 },
        { english: 'Thank you very much.', chinese: '非常感谢。', bookKey: 'NCE1', unit: 1 },
        { english: 'Nice to meet you.', chinese: '很高兴见到你。', bookKey: 'NCE1', unit: 5 },
        { english: 'Are you a teacher?', chinese: '您是教师吗？', bookKey: 'NCE1', unit: 7 },
        { english: 'How are you today?', chinese: '你今天好吗？', bookKey: 'NCE1', unit: 9 },
        { english: 'Is this your shirt?', chinese: '这是您的衬衫吗？', bookKey: 'NCE1', unit: 11 },
        { english: 'That\'s a nice dress.', chinese: '那是一件漂亮的连衣裙。', bookKey: 'NCE1', unit: 13 },
        { english: 'Your passports, please.', chinese: '请出示你们的护照。', bookKey: 'NCE1', unit: 15 }
      ],
      NCE2: [
        { english: 'Last week I went to the theatre.', chinese: '上星期我去看戏。', bookKey: 'NCE2', unit: 1 },
        { english: 'I had a very good seat.', chinese: '我的座位很好。', bookKey: 'NCE2', unit: 1 },
        { english: 'The play was very interesting.', chinese: '戏很有意思。', bookKey: 'NCE2', unit: 1 },
        { english: 'I did not enjoy it.', chinese: '但我却无法欣赏。', bookKey: 'NCE2', unit: 1 },
        { english: 'It was Sunday.', chinese: '那是个星期天。', bookKey: 'NCE2', unit: 2 },
        { english: 'I never get up early on Sundays.', chinese: '星期天我从不早起。', bookKey: 'NCE2', unit: 2 },
        { english: 'I sometimes stay in bed until lunchtime.', chinese: '有时我要一直躺到吃午饭的时候。', bookKey: 'NCE2', unit: 2 },
        { english: 'Just then, the telephone rang.', chinese: '就在这时，电话铃响了。', bookKey: 'NCE2', unit: 2 },
        { english: 'Please send me a card.', chinese: '请寄给我一张明信片。', bookKey: 'NCE2', unit: 3 },
        { english: 'I visited museums and sat in public gardens.', chinese: '我参观了博物馆，还去了公园。', bookKey: 'NCE2', unit: 3 }
      ],
      NCE3: [
        { english: 'Pumas are large, cat-like animals which are found in America.', chinese: '美洲狮是一种体形似猫的大动物，产于美洲。', bookKey: 'NCE3', unit: 1 },
        { english: 'When reports came into London Zoo that a wild puma had been spotted forty-five miles south of London, they were not taken seriously.', chinese: '当伦敦动物园接到报告说，在伦敦以南45英里处发现一只美洲狮时，这些报告并没有受到重视。', bookKey: 'NCE3', unit: 1 },
        { english: 'However, as the evidence began to accumulate, experts from the Zoo felt obliged to investigate.', chinese: '然而，随着证据越来越多，动物园的专家们感到有必要进行一番调查。', bookKey: 'NCE3', unit: 1 },
        { english: 'The hunt for the puma began in a small village.', chinese: '搜寻美洲狮的工作是从一座小村庄开始的。', bookKey: 'NCE3', unit: 1 },
        { english: 'Our vicar is always raising money for one cause or another.', chinese: '我们教区的牧师总是为各种各样的事筹集资金。', bookKey: 'NCE3', unit: 2 },
        { english: 'The vicar has been asked to have the tree cut down.', chinese: '人们曾要求牧师把这棵树砍掉。', bookKey: 'NCE3', unit: 2 },
        { english: 'The tree was planted near the church fifty years ago.', chinese: '这棵树是50年前栽在教堂附近的。', bookKey: 'NCE3', unit: 2 },
        { english: 'In spite of all that has been said, the tourists have been picking leaves.', chinese: '尽管已说了这番话，游客们还是继续采摘树叶。', bookKey: 'NCE3', unit: 2 }
      ],
      NCE4: [
        { english: 'The process of the fossilization of plants and animals requires the rapid covering of the dead organisms.', chinese: '植物和动物的化石化过程需要这些死亡生物被迅速覆盖。', bookKey: 'NCE4', unit: 1 },
        { english: 'Very often the traces of soft parts are lost.', chinese: '通常，柔软部分的痕迹会消失。', bookKey: 'NCE4', unit: 1 },
        { english: 'Sometimes, however, when the conditions are just right, traces of the soft parts are preserved.', chinese: '然而，有时当条件恰好合适时，柔软部分的痕迹会被保存下来。', bookKey: 'NCE4', unit: 1 },
        { english: 'The fossil remains of animals are much rarer than those of plants.', chinese: '动物的化石遗存比植物的要稀少得多。', bookKey: 'NCE4', unit: 1 },
        { english: 'We can read of things that happened 5,000 years ago in the Near East.', chinese: '我们从书籍中可以读到5,000年前近东发生的事情。', bookKey: 'NCE4', unit: 2 },
        { english: 'But the first people who were like ourselves lived so long ago that even their sagas are forgotten.', chinese: '但是，和我们相似的最早的人类生活在很久以前，连他们的传说都已失传。', bookKey: 'NCE4', unit: 2 },
        { english: 'We know nothing about them except that they lived in caves.', chinese: '我们对他们一无所知，只知道他们居住在洞穴里。', bookKey: 'NCE4', unit: 2 },
        { english: 'Archaeology is a source of history, not just a bumbling auxiliary discipline.', chinese: '考古学是历史的一个来源，而不只是一种笨拙的辅助学科。', bookKey: 'NCE4', unit: 2 }
      ]
    };

    for (const [bookKey, sents] of Object.entries(sentences)) {
      this.sentenceDatabase.push(...sents);
    }

    const grammarPoints = {
      NCE1: [
        { 
          title: '一般现在时', 
          explanation: '表示经常性或习惯性的动作，或客观真理。', 
          examples: ['I go to school every day.', 'The sun rises in the east.'],
          bookKey: 'NCE1'
        },
        { 
          title: '冠词的用法', 
          explanation: 'a/an表示泛指，the表示特指。', 
          examples: ['This is a book.', 'The book is on the table.'],
          bookKey: 'NCE1'
        },
        { 
          title: '物主代词', 
          explanation: 'my, your, his, her, its, our, their表示所属关系。', 
          examples: ['This is my pen.', 'Is that your bag?'],
          bookKey: 'NCE1'
        },
        { 
          title: '介词in, on, at', 
          explanation: 'in用于大地点，at用于小地点，on用于街道等。', 
          examples: ['I live in China.', 'He is at home.'],
          bookKey: 'NCE1'
        }
      ],
      NCE2: [
        { 
          title: '一般过去时', 
          explanation: '表示过去发生的动作或存在的状态。', 
          examples: ['I went to the park yesterday.', 'She was born in 2000.'],
          bookKey: 'NCE2'
        },
        { 
          title: '现在进行时', 
          explanation: '表示现在正在进行的动作。', 
          examples: ['I am reading a book.', 'They are playing football.'],
          bookKey: 'NCE2'
        },
        { 
          title: '现在完成时', 
          explanation: '表示过去发生的动作对现在造成的影响或结果。', 
          examples: ['I have finished my homework.', 'She has been to Beijing.'],
          bookKey: 'NCE2'
        },
        { 
          title: '被动语态', 
          explanation: '主语是动作的承受者。', 
          examples: ['The book was written by him.', 'The window was broken.'],
          bookKey: 'NCE2'
        }
      ],
      NCE3: [
        { 
          title: '定语从句', 
          explanation: '修饰名词或代词的从句，由关系代词或关系副词引导。', 
          examples: ['The man who is speaking is my teacher.', 'This is the book that I bought.'],
          bookKey: 'NCE3'
        },
        { 
          title: '同位语从句', 
          explanation: '对前面的名词进行解释说明的从句。', 
          examples: ['The news that he won the game is exciting.', 'I have no idea where he is.'],
          bookKey: 'NCE3'
        },
        { 
          title: '虚拟语气', 
          explanation: '表示假设或非真实的情况。', 
          examples: ['If I were you, I would go.', 'I wish I had more time.'],
          bookKey: 'NCE3'
        },
        { 
          title: '倒装句', 
          explanation: '将谓语动词或助动词提到主语之前的句子。', 
          examples: ['Never have I seen such a thing.', 'Rarely does he come here.'],
          bookKey: 'NCE3'
        }
      ],
      NCE4: [
        { 
          title: '名词性从句', 
          explanation: '在句子中起名词作用的从句，包括主语从句、宾语从句、表语从句和同位语从句。', 
          examples: ['What he said is true.', 'I think that he is right.'],
          bookKey: 'NCE4'
        },
        { 
          title: '状语从句', 
          explanation: '在句子中作状语的从句，修饰动词、形容词或副词。', 
          examples: ['When he came, I was reading.', 'Although it is late, he is still working.'],
          bookKey: 'NCE4'
        },
        { 
          title: '强调句', 
          explanation: '用It is/was...that/who...结构来强调句子的某一部分。', 
          examples: ['It is Tom who broke the window.', 'It was yesterday that I met him.'],
          bookKey: 'NCE4'
        },
        { 
          title: '分词作状语', 
          explanation: '现在分词和过去分词可以在句子中作状语，表示时间、原因、条件、让步等。', 
          examples: ['Hearing the news, she cried.', 'Seen from the hill, the city looks beautiful.'],
          bookKey: 'NCE4'
        }
      ]
    };

    for (const [bookKey, points] of Object.entries(grammarPoints)) {
      this.grammarDatabase.push(...points);
    }
  }

  getWords(bookKeys = ['NCE1']) {
    return this.wordDatabase.filter(word => bookKeys.includes(word.bookKey));
  }

  getRandomWords(bookKeys = ['NCE1'], count = 10) {
    const words = this.getWords(bookKeys);
    const shuffled = [...words].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  }

  getSentences(bookKeys = ['NCE1']) {
    return this.sentenceDatabase.filter(sent => bookKeys.includes(sent.bookKey));
  }

  getRandomSentences(bookKeys = ['NCE1'], count = 10) {
    const sentences = this.getSentences(bookKeys);
    const shuffled = [...sentences].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  }

  getGrammar(bookKeys = ['NCE1']) {
    return this.grammarDatabase.filter(g => bookKeys.includes(g.bookKey));
  }

  getUnits(bookKey) {
    const bookData = this.allUnits.get(bookKey);
    return bookData ? bookData.units : [];
  }

  getAllUnits(bookKeys = ['NCE1']) {
    let units = [];
    for (const bookKey of bookKeys) {
      const bookData = this.allUnits.get(bookKey);
      if (bookData) {
        units.push(...bookData.units.map(u => ({ ...u, bookKey })));
      }
    }
    return units;
  }
}

class EnglishLearningApp {
  constructor() {
    this.currentPage = 'home';
    this.nceData = new NCEDataManager();
    this.selectedBooks = ['NCE1'];
    this.wordsLearned = [];
    this.currentWordIndex = 0;
    this.currentFlashcardIndex = 0;
    this.currentListeningIndex = 0;
    this.currentSpeakingIndex = 0;
    this.currentGrammarIndex = 0;
    this.currentReadingIndex = 0;
    this.currentThemeColor = '#ff6b35';
    this.currentFont = 'Georgia, serif';
    
    this.dailyGoals = {
      words: 20,
      listening: 1,
      speaking: 10,
      grammar: 1,
      reading: 1
    };
    
    this.dailyProgress = {
      words: {
        completed: 0,
        remembered: 0,
        fuzzy: 0,
        forgot: 0
      },
      listening: 0,
      speaking: 0,
      grammar: 0,
      reading: 0
    };

    this.chatConversations = [];
    this.currentConversationId = null;
    this.chatMessages = [];
    this.isRecording = false;
    this.isCallActive = false;
    this.isMuted = false;
    this.isSpeakerOn = true;
    this.mediaRecorder = null;
    this.audioChunks = [];
    this.recognition = null;
    this.synthesis = window.speechSynthesis;
    
    this.aiConfig = {
      serviceMode: 'cloud',
      provider: 'openai',
      apiKey: '',
      apiUrl: 'https://api.openai.com/v1',
      model: 'gpt-4o',
      ollamaUrl: 'http://localhost:11434',
      ollamaModel: 'llama3.2',
      autoSpeakAiResponse: false,
      tokenUsage: {}
    };
    
    this.checkinGoals = [];
    this.checkinRecords = [];
    this.editingGoalId = null;
    
    this.homeEditMode = false;
    this.draggingCard = null;
    this.resizingCard = null;
    this.dragOffset = { x: 0, y: 0 };
    this.resizeStart = { x: 0, y: 0, width: 0, height: 0 };
    
    this.modelLists = this.loadModelLists();
    
    this.init();
  }

  async init() {
    try {
      console.log('开始初始化...');
      await this.nceData.init();
      console.log('NCE数据初始化完成');
      
      this.loadPreferences();
      this.loadDailyGoals();
      this.loadDailyProgress();
      this.loadAiConfig();
      this.loadChatConversations();
      this.loadCheckinData();
      
      console.log('初始化导航...');
      this.initNavigation();
      
      console.log('初始化主题切换...');
      this.initThemeToggle();
      
      console.log('初始化首页...');
      this.initHomePage();
      this.initCheckinFeature();
      this.initHomeEditMode();
      this.loadCardLayouts();
      
      try {
        this.initGoalModal();
      } catch (e) {
        console.error('initGoalModal 出错:', e);
      }
      
      try {
        this.initChatPage();
      } catch (e) {
        console.error('initChatPage 出错:', e);
      }
      
      try {
        this.initWordsPage();
      } catch (e) {
        console.error('initWordsPage 出错:', e);
      }
      
      try {
        this.initListeningPage();
      } catch (e) {
        console.error('initListeningPage 出错:', e);
      }
      
      try {
        this.initSpeakingPage();
      } catch (e) {
        console.error('initSpeakingPage 出错:', e);
      }
      
      try {
        this.initGrammarPage();
      } catch (e) {
        console.error('initGrammarPage 出错:', e);
      }
      
      try {
        this.initReadingPage();
      } catch (e) {
        console.error('initReadingPage 出错:', e);
      }
      
      try {
        this.initCoursesPage();
      } catch (e) {
        console.error('initCoursesPage 出错:', e);
      }
      
      try {
        this.initSettingsPage();
        if (this.aiConfig.provider === 'gemini' && this.aiConfig.apiKey) {
          await this.updateProviderDefaults('gemini');
        }
      } catch (e) {
        console.error('initSettingsPage 出错:', e);
      }
      
      try {
        this.initStatsPage();
      } catch (e) {
        console.error('initStatsPage 出错:', e);
      }
      
      try {
        this.updateHomePageStats();
      } catch (e) {
        console.error('updateHomePageStats 出错:', e);
      }
      
      console.log('初始化完成！');
    } catch (error) {
      console.error('初始化失败:', error);
      alert('应用初始化失败，请查看控制台了解详情。');
    }
  }

  initNavigation() {
    const navItems = qsa('.nav-item');
    navItems.forEach(item => {
      item.addEventListener('click', () => {
        const page = item.dataset.page;
        this.navigateTo(page);
      });
    });
  }

  navigateTo(page) {
    console.log('切换到页面:', page);
    
    const navItems = qsa('.nav-item');
    navItems.forEach(item => {
      item.classList.toggle('active', item.dataset.page === page);
    });

    const pages = qsa('.page');
    pages.forEach(p => {
      const isActive = p.id === `page-${page}`;
      p.classList.toggle('active', isActive);
    });

    this.currentPage = page;
    
    if (page === 'stats') {
      setTimeout(() => {
        this.renderCharts();
        this.updateSummaryStats();
      }, 100);
    }
    
    if (page === 'chat') {
      setTimeout(() => {
        this.renderChatList();
        this.restoreChatMessages();
      }, 100);
    }
    
    if (page === 'home') {
      setTimeout(() => {
        this.updateHomePageStats();
      }, 100);
    }
    
    if (page === 'words') {
      setTimeout(() => {
        if (typeof this.initWordsPage === 'function') {
          this.initWordsPage();
        }
      }, 100);
    }
  }

  initThemeToggle() {
    const themeToggle = qs('#themeToggle');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');

    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark' || (!savedTheme && prefersDark.matches)) {
      document.body.classList.add('dark-theme');
    }

    if (themeToggle) {
      themeToggle.addEventListener('click', () => {
        document.body.classList.toggle('dark-theme');
        const isDark = document.body.classList.contains('dark-theme');
        localStorage.setItem('theme', isDark ? 'dark' : 'light');

        themeToggle.style.transform = 'rotate(360deg)';
        setTimeout(() => {
          themeToggle.style.transform = '';
        }, 300);
      });
    }

    prefersDark.addEventListener('change', (event) => {
      if (!localStorage.getItem('theme')) {
        if (event.matches) {
          document.body.classList.add('dark-theme');
        } else {
          document.body.classList.remove('dark-theme');
        }
      }
    });
  }

  loadPreferences() {
    const savedColor = localStorage.getItem('themeColor');
    if (savedColor) {
      this.currentThemeColor = savedColor;
      this.applyThemeColor(savedColor);
    }
    
    const savedFont = localStorage.getItem('selectedFont');
    if (savedFont) {
      this.currentFont = savedFont;
      this.applyFont(savedFont);
    }
  }

  applyThemeColor(color) {
    const root = document.documentElement;
    root.style.setProperty('--accent-1', color);
    
    const lighterColor = this.adjustColor(color, 30);
    root.style.setProperty('--accent-2', lighterColor);
    
    const rgbaColor = this.hexToRgba(color, 0.18);
    root.style.setProperty('--accent-3', rgbaColor);
    
    const rgbaStrongColor = this.hexToRgba(color, 0.35);
    root.style.setProperty('--accent-strong', rgbaStrongColor);
    
    this.updateBackgroundGradient(color);
  }

  adjustColor(hex, percent) {
    const num = parseInt(hex.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.min(255, (num >> 16) + amt);
    const G = Math.min(255, (num >> 8 & 0x00FF) + amt);
    const B = Math.min(255, (num & 0x0000FF) + amt);
    return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
  }

  hexToRgba(hex, alpha) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  updateBackgroundGradient(color) {
    const rgba1 = this.hexToRgba(color, 0.14);
    const rgba2 = 'rgba(31, 138, 122, 0.18)';
    document.body.style.background = `
      radial-gradient(circle at 12% 8%, ${rgba1}, transparent 40%),
      radial-gradient(circle at 88% 12%, ${rgba2}, transparent 45%),
      linear-gradient(180deg, var(--paper-1) 0%, var(--paper-2) 100%)
    `;
  }

  applyFont(font) {
    document.documentElement.style.setProperty('--font-sans', font);
    const preview = qs('#fontPreview');
    if (preview) {
      preview.style.fontFamily = font;
    }
  }

  initSettingsPage() {
    console.log('初始化设置页面...');
    try {
      const colorOptions = qsa('.color-option');
      colorOptions.forEach(option => {
        option.addEventListener('click', () => {
          const color = option.dataset.color;
          this.currentThemeColor = color;
          localStorage.setItem('themeColor', color);
          this.applyThemeColor(color);
          
          colorOptions.forEach(opt => opt.classList.remove('active'));
          option.classList.add('active');
        });
        
        if (option.dataset.color === this.currentThemeColor) {
          option.classList.add('active');
        }
      });
      
      const fontSelect = qs('#fontSelect');
      if (fontSelect) {
        fontSelect.value = this.currentFont;
        fontSelect.addEventListener('change', (e) => {
          const font = e.target.value;
          this.currentFont = font;
          localStorage.setItem('selectedFont', font);
          this.applyFont(font);
        });
      }
      
      const preview = qs('#fontPreview');
      if (preview) {
        preview.style.fontFamily = this.currentFont;
      }

      this.initBackupRestore();
      this.initAiConfig();
      console.log('设置页面初始化完成');
    } catch (error) {
      console.error('设置页面初始化失败:', error);
    }
  }

  initBackupRestore() {
    const exportBtn = qs('#exportDataBtn');
    const importInput = qs('#importDataInput');

    if (exportBtn) {
      exportBtn.addEventListener('click', () => this.exportData());
    }

    if (importInput) {
      importInput.addEventListener('change', (e) => this.importData(e));
    }
  }

  exportData() {
    const data = {};
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        try {
          const value = localStorage.getItem(key);
          data[key] = value;
        } catch (e) {
          console.error('导出数据时出错:', key, e);
        }
      }
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    
    const date = new Date();
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    
    a.href = url;
    a.download = `大屌哥学英语_备份_${dateStr}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    alert('数据导出成功！');
  }

  importData(event) {
    const file = event.target.files[0];
    if (!file) return;

    if (!confirm('导入数据将覆盖现有数据，确定要继续吗？')) {
      event.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        
        localStorage.clear();
        
        for (const [key, value] of Object.entries(data)) {
          localStorage.setItem(key, value);
        }

        this.loadPreferences();
        this.loadDailyGoals();
        this.loadDailyProgress();
        this.updateHomePageStats();
        
        if (this.wordStudyManager) {
          this.wordStudyManager.updateStats();
        }

        alert('数据导入成功！页面将刷新以应用新数据。');
        location.reload();
      } catch (error) {
        console.error('导入数据失败:', error);
        alert('数据导入失败，请确保文件格式正确！');
      }
      
      event.target.value = '';
    };
    
    reader.readAsText(file);
  }

  getTodayKey() {
    const today = new Date();
    return `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
  }

  loadDailyGoals() {
    const saved = localStorage.getItem('dailyGoals');
    if (saved) {
      this.dailyGoals = JSON.parse(saved);
    }
  }

  saveDailyGoals() {
    localStorage.setItem('dailyGoals', JSON.stringify(this.dailyGoals));
  }

  loadDailyProgress() {
    const todayKey = this.getTodayKey();
    const saved = localStorage.getItem(`dailyProgress_${todayKey}`);
    if (saved) {
      this.dailyProgress = JSON.parse(saved);
    } else {
      this.dailyProgress = {
        words: {
          completed: 0,
          remembered: 0,
          fuzzy: 0,
          forgot: 0
        },
        listening: 0,
        speaking: 0,
        grammar: 0
      };
    }
  }

  saveDailyProgress() {
    const todayKey = this.getTodayKey();
    localStorage.setItem(`dailyProgress_${todayKey}`, JSON.stringify(this.dailyProgress));
  }

  initGoalModal() {
    const setGoalBtn = qs('#setGoalBtn');
    const closeGoalModal = qs('#closeGoalModal');
    const cancelGoalBtn = qs('#cancelGoalBtn');
    const saveGoalBtn = qs('#saveGoalBtn');
    const goalModal = qs('#goalModal');

    if (setGoalBtn) {
      setGoalBtn.addEventListener('click', () => {
        this.openGoalModal();
      });
    }

    if (closeGoalModal) {
      closeGoalModal.addEventListener('click', () => {
        this.closeGoalModal();
      });
    }

    if (cancelGoalBtn) {
      cancelGoalBtn.addEventListener('click', () => {
        this.closeGoalModal();
      });
    }

    if (saveGoalBtn) {
      saveGoalBtn.addEventListener('click', () => {
        this.saveGoalModal();
      });
    }

    if (goalModal) {
      goalModal.addEventListener('click', (e) => {
        if (e.target === goalModal) {
          this.closeGoalModal();
        }
      });
    }
  }

  openGoalModal() {
    const goalModal = qs('#goalModal');
    const goalWords = qs('#goalWords');
    const goalListening = qs('#goalListening');
    const goalSpeaking = qs('#goalSpeaking');
    const goalGrammar = qs('#goalGrammar');
    const goalReading = qs('#goalReading');

    if (goalWords) goalWords.value = this.dailyGoals.words;
    if (goalListening) goalListening.value = this.dailyGoals.listening;
    if (goalSpeaking) goalSpeaking.value = this.dailyGoals.speaking;
    if (goalGrammar) goalGrammar.value = this.dailyGoals.grammar;
    if (goalReading) goalReading.value = this.dailyGoals.reading;

    if (goalModal) {
      goalModal.style.display = 'flex';
    }
  }

  closeGoalModal() {
    const goalModal = qs('#goalModal');
    if (goalModal) {
      goalModal.style.display = 'none';
    }
  }

  saveGoalModal() {
    const goalWords = qs('#goalWords');
    const goalListening = qs('#goalListening');
    const goalSpeaking = qs('#goalSpeaking');
    const goalGrammar = qs('#goalGrammar');
    const goalReading = qs('#goalReading');

    if (goalWords) this.dailyGoals.words = parseInt(goalWords.value) || 20;
    if (goalListening) this.dailyGoals.listening = parseInt(goalListening.value) || 1;
    if (goalSpeaking) this.dailyGoals.speaking = parseInt(goalSpeaking.value) || 10;
    if (goalGrammar) this.dailyGoals.grammar = parseInt(goalGrammar.value) || 1;
    if (goalReading) this.dailyGoals.reading = parseInt(goalReading.value) || 1;

    this.saveDailyGoals();
    this.updateTaskGoal();
    this.updateHomePageStats();
    this.closeGoalModal();
  }

  updateTaskGoal() {
    const taskGoal = qs('#taskGoal');
    if (taskGoal) {
      taskGoal.textContent = `今日目标：单词${this.dailyGoals.words} + 听力${this.dailyGoals.listening}篇 + 口语${this.dailyGoals.speaking}句 + 语法${this.dailyGoals.grammar}节 + 阅读${this.dailyGoals.reading}篇`;
    }
  }

  updateHomePageStats() {
    const wordGoal = qs('#wordGoal');
    const wordCompleted = qs('#wordCompleted');
    const wordRemembered = qs('#wordRemembered');
    const wordFuzzy = qs('#wordFuzzy');
    const wordForgot = qs('#wordForgot');
    const wordCompletionRate = qs('#wordCompletionRate');
    const wordRememberRate = qs('#wordRememberRate');

    const listeningGoal = qs('#listeningGoal');
    const listeningCompleted = qs('#listeningCompleted');
    const listeningCompletionRate = qs('#listeningCompletionRate');

    const speakingGoal = qs('#speakingGoal');
    const speakingCompleted = qs('#speakingCompleted');
    const speakingCompletionRate = qs('#speakingCompletionRate');

    const grammarGoal = qs('#grammarGoal');
    const grammarCompleted = qs('#grammarCompleted');
    const grammarCompletionRate = qs('#grammarCompletionRate');

    const readingGoal = qs('#readingGoal');
    const readingCompleted = qs('#readingCompleted');
    const readingCompletionRate = qs('#readingCompletionRate');

    const totalProgressValue = qs('#totalProgressValue');
    const totalProgressFill = qs('#totalProgressFill');
    const streakDays = qs('#streakDays');

    if (wordGoal) wordGoal.textContent = this.dailyGoals.words;
    if (wordCompleted) wordCompleted.textContent = this.dailyProgress.words.completed;
    if (wordRemembered) wordRemembered.textContent = this.dailyProgress.words.remembered;
    if (wordFuzzy) wordFuzzy.textContent = this.dailyProgress.words.fuzzy;
    if (wordForgot) wordForgot.textContent = this.dailyProgress.words.forgot;

    const wordCompletionRateVal = this.dailyGoals.words > 0 
      ? Math.min(100, Math.round((this.dailyProgress.words.completed / this.dailyGoals.words) * 100)) 
      : 0;
    if (wordCompletionRate) wordCompletionRate.textContent = `${wordCompletionRateVal}%`;

    const rememberRate = this.dailyProgress.words.completed > 0 
      ? Math.round((this.dailyProgress.words.remembered / this.dailyProgress.words.completed) * 100) 
      : 0;
    if (wordRememberRate) wordRememberRate.textContent = `${rememberRate}%`;

    if (listeningGoal) listeningGoal.textContent = this.dailyGoals.listening;
    if (listeningCompleted) listeningCompleted.textContent = this.dailyProgress.listening;
    const listeningRate = this.dailyGoals.listening > 0 
      ? Math.min(100, Math.round((this.dailyProgress.listening / this.dailyGoals.listening) * 100)) 
      : 0;
    if (listeningCompletionRate) listeningCompletionRate.textContent = `${listeningRate}%`;

    if (speakingGoal) speakingGoal.textContent = this.dailyGoals.speaking;
    if (speakingCompleted) speakingCompleted.textContent = this.dailyProgress.speaking;
    const speakingRate = this.dailyGoals.speaking > 0 
      ? Math.min(100, Math.round((this.dailyProgress.speaking / this.dailyGoals.speaking) * 100)) 
      : 0;
    if (speakingCompletionRate) speakingCompletionRate.textContent = `${speakingRate}%`;

    if (grammarGoal) grammarGoal.textContent = this.dailyGoals.grammar;
    if (grammarCompleted) grammarCompleted.textContent = this.dailyProgress.grammar;
    const grammarRate = this.dailyGoals.grammar > 0 
      ? Math.min(100, Math.round((this.dailyProgress.grammar / this.dailyGoals.grammar) * 100)) 
      : 0;
    if (grammarCompletionRate) grammarCompletionRate.textContent = `${grammarRate}%`;

    if (readingGoal) readingGoal.textContent = this.dailyGoals.reading;
    if (readingCompleted) readingCompleted.textContent = this.dailyProgress.reading;
    const readingRate = this.dailyGoals.reading > 0 
      ? Math.min(100, Math.round((this.dailyProgress.reading / this.dailyGoals.reading) * 100)) 
      : 0;
    if (readingCompletionRate) readingCompletionRate.textContent = `${readingRate}%`;

    const totalModules = 5;
    const totalProgress = Math.round((wordCompletionRateVal + listeningRate + speakingRate + grammarRate + readingRate) / totalModules);
    if (totalProgressValue) totalProgressValue.textContent = `${totalProgress}%`;
    if (totalProgressFill) totalProgressFill.style.width = `${totalProgress}%`;

    let streak = 0;
    const today = new Date();
    let consecutive = true;
    
    for (let i = 0; i < 365 && consecutive; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateKey = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
      const saved = localStorage.getItem(`dailyProgress_${dateKey}`);
      
      if (saved) {
        const progress = JSON.parse(saved);
        const hasActivity = progress.words.completed > 0 || progress.listening > 0 || 
                           progress.speaking > 0 || progress.grammar > 0 || progress.reading > 0;
        if (hasActivity) {
          streak++;
        } else {
          consecutive = false;
        }
      } else {
        consecutive = false;
      }
    }
    
    if (streakDays) streakDays.textContent = `${streak}天`;

    this.updateTaskGoal();
  }

  recordWordProgress(result) {
    this.dailyProgress.words.completed++;
    if (result === 'remembered') {
      this.dailyProgress.words.remembered++;
    } else if (result === 'fuzzy') {
      this.dailyProgress.words.fuzzy++;
    } else if (result === 'forgot') {
      this.dailyProgress.words.forgot++;
    }
    this.saveDailyProgress();
    this.updateHomePageStats();
  }

  recordListeningProgress() {
    this.dailyProgress.listening++;
    this.saveDailyProgress();
    this.updateHomePageStats();
  }

  recordSpeakingProgress() {
    this.dailyProgress.speaking++;
    this.saveDailyProgress();
    this.updateHomePageStats();
  }

  recordGrammarProgress() {
    this.dailyProgress.grammar++;
    this.saveDailyProgress();
    this.updateHomePageStats();
  }

  recordReadingProgress() {
    this.dailyProgress.reading++;
    this.saveDailyProgress();
    this.updateHomePageStats();
  }

  initStatsPage() {
    console.log('初始化统计页面...');
    try {
      this.statsPeriod = 'week';
      
      const tabs = qsa('.stats-tab');
      tabs.forEach(tab => {
        tab.addEventListener('click', () => {
          tabs.forEach(t => t.classList.remove('active'));
          tab.classList.add('active');
          this.statsPeriod = tab.dataset.period;
          this.renderCharts();
          this.updateSummaryStats();
        });
      });

      this.renderCharts();
      this.updateSummaryStats();
      console.log('统计页面初始化完成');
    } catch (error) {
      console.error('统计页面初始化失败:', error);
    }
  }

  getStatsData(period) {
    const days = period === 'week' ? 7 : 30;
    const data = [];
    const today = new Date();
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateKey = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
      const saved = localStorage.getItem(`dailyProgress_${dateKey}`);
      
      if (saved) {
        const progress = JSON.parse(saved);
        data.push({
          date: `${date.getMonth() + 1}/${date.getDate()}`,
          words: progress.words.completed,
          listening: progress.listening,
          speaking: progress.speaking,
          grammar: progress.grammar,
          reading: progress.reading
        });
      } else {
        data.push({
          date: `${date.getMonth() + 1}/${date.getDate()}`,
          words: 0,
          listening: 0,
          speaking: 0,
          grammar: 0,
          reading: 0
        });
      }
    }
    
    return data;
  }

  renderCharts() {
    this.renderTrendChart();
    this.renderSkillsChart();
    this.renderMemoryChart();
  }

  renderTrendChart() {
    const canvas = qs('#trendChart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const data = this.getStatsData(this.statsPeriod);
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const padding = 40;
    const chartWidth = canvas.width - padding * 2;
    const chartHeight = canvas.height - padding * 2;
    
    const maxValue = Math.max(...data.map(d => 
      Math.max(d.words, d.listening * 10, d.speaking, d.grammar * 10, d.reading * 10)
    )) || 10;
    
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 5; i++) {
      const y = padding + (chartHeight / 5) * i;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(canvas.width - padding, y);
      ctx.stroke();
    }
    
    const colors = ['#ff6b35', '#3b82f6', '#10b981', '#8b5cf6', '#f59e0b'];
    const labels = ['words', 'listening', 'speaking', 'grammar', 'reading'];
    const multipliers = [1, 10, 1, 10, 10];
    
    labels.forEach((label, labelIndex) => {
      ctx.strokeStyle = colors[labelIndex];
      ctx.lineWidth = 2;
      ctx.beginPath();
      
      data.forEach((d, i) => {
        const x = padding + (chartWidth / (data.length - 1)) * i;
        const value = d[label] * multipliers[labelIndex];
        const y = padding + chartHeight - (value / maxValue) * chartHeight;
        
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });
      
      ctx.stroke();
      
      data.forEach((d, i) => {
        const x = padding + (chartWidth / (data.length - 1)) * i;
        const value = d[label] * multipliers[labelIndex];
        const y = padding + chartHeight - (value / maxValue) * chartHeight;
        
        ctx.fillStyle = colors[labelIndex];
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fill();
      });
    });
    
    ctx.fillStyle = '#6b6f76';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';
    data.forEach((d, i) => {
      const x = padding + (chartWidth / (data.length - 1)) * i;
      ctx.fillText(d.date, x, canvas.height - 10);
    });
    
    const legendLabels = ['单词', '听力', '口语', '语法', '阅读'];
    legendLabels.forEach((label, i) => {
      ctx.fillStyle = colors[i];
      ctx.fillRect(padding + i * 80, 10, 15, 15);
      ctx.fillStyle = '#6b6f76';
      ctx.textAlign = 'left';
      ctx.fillText(label, padding + i * 80 + 20, 22);
    });
  }

  renderSkillsChart() {
    const canvas = qs('#skillsChart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(centerX, centerY) - 30;
    
    const skills = ['单词', '听力', '口语', '语法', '阅读'];
    const colors = ['#ff6b35', '#3b82f6', '#10b981', '#8b5cf6', '#f59e0b'];
    const values = [
      this.dailyProgress.words.completed,
      this.dailyProgress.listening * 10,
      this.dailyProgress.speaking,
      this.dailyProgress.grammar * 10,
      this.dailyProgress.reading * 10
    ];
    
    const maxValue = Math.max(...values, 1);
    const angleStep = (Math.PI * 2) / skills.length;
    
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 1;
    for (let i = 0; i < 5; i++) {
      const r = (radius / 5) * (i + 1);
      ctx.beginPath();
      ctx.arc(centerX, centerY, r, 0, Math.PI * 2);
      ctx.stroke();
    }
    
    skills.forEach((_, i) => {
      const angle = angleStep * i - Math.PI / 2;
      ctx.strokeStyle = '#e0e0e0';
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(centerX + Math.cos(angle) * radius, centerY + Math.sin(angle) * radius);
      ctx.stroke();
    });
    
    ctx.fillStyle = 'rgba(255, 107, 53, 0.3)';
    ctx.strokeStyle = '#ff6b35';
    ctx.lineWidth = 2;
    ctx.beginPath();
    
    values.forEach((value, i) => {
      const angle = angleStep * i - Math.PI / 2;
      const r = (value / maxValue) * radius;
      const x = centerX + Math.cos(angle) * r;
      const y = centerY + Math.sin(angle) * r;
      
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    
    ctx.fillStyle = '#6b6f76';
    ctx.font = '13px sans-serif';
    ctx.textAlign = 'center';
    skills.forEach((skill, i) => {
      const angle = angleStep * i - Math.PI / 2;
      const x = centerX + Math.cos(angle) * (radius + 20);
      const y = centerY + Math.sin(angle) * (radius + 20);
      
      if (Math.abs(Math.cos(angle)) < 0.1) {
        ctx.textAlign = 'center';
      } else if (Math.cos(angle) > 0) {
        ctx.textAlign = 'left';
      } else {
        ctx.textAlign = 'right';
      }
      
      ctx.fillText(skill, x, y + 5);
    });
  }

  renderMemoryChart() {
    const canvas = qs('#memoryChart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(centerX, centerY) - 40;
    
    const categories = ['记住', '模糊', '忘记'];
    const colors = ['#22c55e', '#f59e0b', '#ef4444'];
    const values = [
      this.dailyProgress.words.remembered,
      this.dailyProgress.words.fuzzy,
      this.dailyProgress.words.forgot
    ];
    
    const total = values.reduce((a, b) => a + b, 0) || 1;
    let startAngle = -Math.PI / 2;
    
    values.forEach((value, i) => {
      const sliceAngle = (value / total) * Math.PI * 2;
      
      ctx.fillStyle = colors[i];
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, startAngle, startAngle + sliceAngle);
      ctx.closePath();
      ctx.fill();
      
      startAngle += sliceAngle;
    });
    
    ctx.fillStyle = '#f7f3ee';
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius * 0.5, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = '#141414';
    ctx.font = 'bold 20px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${total}`, centerX, centerY - 5);
    ctx.font = '12px sans-serif';
    ctx.fillStyle = '#6b6f76';
    ctx.fillText('单词', centerX, centerY + 12);
    
    const legendY = canvas.height - 30;
    categories.forEach((category, i) => {
      const x = 30 + i * 120;
      ctx.fillStyle = colors[i];
      ctx.fillRect(x, legendY, 15, 15);
      ctx.fillStyle = '#6b6f76';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(`${category}: ${values[i]}`, x + 22, legendY + 12);
    });
  }

  updateSummaryStats() {
    const totalStudyDays = qs('#totalStudyDays');
    const currentStreak = qs('#currentStreak');
    const totalWords = qs('#totalWords');
    const goalCompleted = qs('#goalCompleted');
    
    let studyDays = 0;
    let streak = 0;
    let wordsCount = 0;
    let goalsCount = 0;
    
    const today = new Date();
    let consecutive = true;
    
    for (let i = 0; i < 365; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateKey = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
      const saved = localStorage.getItem(`dailyProgress_${dateKey}`);
      
      if (saved) {
        const progress = JSON.parse(saved);
        studyDays++;
        
        if (consecutive) {
          const hasActivity = progress.words.completed > 0 || progress.listening > 0 || 
                             progress.speaking > 0 || progress.grammar > 0 || progress.reading > 0;
          if (hasActivity) {
            streak++;
          } else {
            consecutive = false;
          }
        }
        
        wordsCount += progress.words.completed;
        
        const wordGoal = this.dailyGoals.words;
        if (progress.words.completed >= wordGoal) {
          goalsCount++;
        }
      } else {
        consecutive = false;
      }
    }
    
    if (totalStudyDays) totalStudyDays.textContent = studyDays;
    if (currentStreak) currentStreak.textContent = `${streak}天`;
    if (totalWords) totalWords.textContent = wordsCount;
    if (goalCompleted) goalCompleted.textContent = goalsCount;
  }

  initHomePage() {
    const knowBtn = qs('#knowBtn');
    const dontKnowBtn = qs('#dontKnowBtn');
    
    if (knowBtn) {
      knowBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.showNextWord();
      });
    }

    if (dontKnowBtn) {
      dontKnowBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.showNextWord();
      });
    }

    const miniPlayBtn = qs('#miniPlayBtn');
    if (miniPlayBtn) {
      miniPlayBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleMiniPlayer();
      });
    }

    const recordBtn = qs('#recordBtn');
    if (recordBtn) {
      recordBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleRecording();
      });
    }

    const clickableCards = document.querySelectorAll('.clickable-card');
    clickableCards.forEach(card => {
      card.addEventListener('click', (e) => {
        const page = card.dataset.page;
        if (page) {
          console.log('首页卡片被点击，导航到:', page);
          this.navigateTo(page);
        }
      });
    });

    this.initBookSelection();
    this.showNextWord();
    this.updateHomePageStats();
  }

  initBookSelection() {
    const bookSelectors = qsa('.book-selector');
    bookSelectors.forEach(selector => {
      const checkboxes = selector.querySelectorAll('input[type="checkbox"]');
      checkboxes.forEach(cb => {
        cb.addEventListener('change', () => {
          this.updateSelectedBooks();
        });
      });
    });
  }

  updateSelectedBooks() {
    const checkboxes = qsa('.book-selector input[type="checkbox"]:checked');
    this.selectedBooks = Array.from(checkboxes).map(cb => cb.value);
    if (this.selectedBooks.length === 0) {
      this.selectedBooks = ['NCE1'];
    }
    localStorage.setItem('selectedBooks', JSON.stringify(this.selectedBooks));
    
    this.currentWordIndex = 0;
    this.currentFlashcardIndex = 0;
    this.currentListeningIndex = 0;
    this.currentSpeakingIndex = 0;
    this.currentGrammarIndex = 0;
    this.currentReadingIndex = 0;
    
    this.showNextWord();
    this.updateFlashcard();
    this.updateListening();
    this.updateSpeaking();
    this.updateGrammar();
    this.updateReading();
  }

  showNextWord() {
    const words = this.nceData.getRandomWords(this.selectedBooks, 1);
    if (words.length > 0) {
      const word = words[0];
      const wordText = qs('.word-text');
      const wordPhonetic = qs('.word-phonetic');
      const wordMeaning = qs('.word-meaning');
      
      if (wordText) wordText.textContent = word.word;
      if (wordPhonetic) wordPhonetic.textContent = word.phonetic;
      if (wordMeaning) wordMeaning.textContent = `${word.meaning}\n例：${word.example}`;
    }
  }

  toggleMiniPlayer() {
    console.log('Mini player toggled');
  }

  toggleRecording() {
    console.log('Recording toggled');
  }

  initWordsPage() {
    this.wordStudyManager = new WordStudyManager(this, this.nceData);
  }

  initListeningPage() {
    const playBtn = qs('#playPauseListening');
    if (playBtn) {
      playBtn.addEventListener('click', () => {
        const playIcon = playBtn.querySelector('.play-icon');
        const pauseIcon = playBtn.querySelector('.pause-icon');
        if (playIcon && pauseIcon) {
          const isPlaying = playIcon.style.display === 'none';
          playIcon.style.display = isPlaying ? 'block' : 'none';
          pauseIcon.style.display = isPlaying ? 'none' : 'block';
        }
      });
    }

    const prevBtn = qs('#prevListening');
    const nextBtn = qs('#nextListening');
    
    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        this.currentListeningIndex = Math.max(0, this.currentListeningIndex - 1);
        this.updateListening();
      });
    }
    
    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        this.currentListeningIndex++;
        this.updateListening();
      });
    }

    this.updateListening();
  }

  updateListening() {
    const sentences = this.nceData.getSentences(this.selectedBooks);
    if (sentences.length > 0) {
      const index = this.currentListeningIndex % sentences.length;
      const sentence = sentences[index];
      
      const title = qs('#listeningTitle');
      const script = qs('#listeningScript');
      const translation = qs('#listeningTranslation');
      
      if (title) title.textContent = `听力练习 ${index + 1}`;
      if (script) script.textContent = sentence.english;
      if (translation) translation.textContent = sentence.chinese;
    }
  }

  initSpeakingPage() {
    const recordBtn = qs('#recordSpeakingBtn');
    if (recordBtn) {
      recordBtn.addEventListener('click', () => {
        console.log('Speaking recording started');
      });
    }

    const prevBtn = qs('#prevSpeaking');
    const nextBtn = qs('#nextSpeaking');
    
    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        this.currentSpeakingIndex = Math.max(0, this.currentSpeakingIndex - 1);
        this.updateSpeaking();
      });
    }
    
    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        this.currentSpeakingIndex++;
        this.updateSpeaking();
      });
    }

    this.updateSpeaking();
  }

  updateSpeaking() {
    const sentences = this.nceData.getSentences(this.selectedBooks);
    if (sentences.length > 0) {
      const index = this.currentSpeakingIndex % sentences.length;
      const sentence = sentences[index];
      
      const text = qs('#speakingText');
      const translation = qs('#speakingTranslation');
      
      if (text) text.textContent = sentence.english;
      if (translation) translation.textContent = sentence.chinese;
    }
  }

  initGrammarPage() {
    const checkBtn = qs('#checkGrammar');
    if (checkBtn) {
      checkBtn.addEventListener('click', () => {
        alert('答案已提交！');
      });
    }

    const prevBtn = qs('#prevGrammar');
    const nextBtn = qs('#nextGrammar');
    
    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        this.currentGrammarIndex = Math.max(0, this.currentGrammarIndex - 1);
        this.updateGrammar();
      });
    }
    
    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        this.currentGrammarIndex++;
        this.updateGrammar();
      });
    }

    this.updateGrammar();
  }

  updateGrammar() {
    const grammars = this.nceData.getGrammar(this.selectedBooks);
    if (grammars.length > 0) {
      const index = this.currentGrammarIndex % grammars.length;
      const grammar = grammars[index];
      
      const title = qs('#grammarTitle');
      const explanation = qs('#grammarExplanation');
      const examples = qs('#grammarExamples');
      
      if (title) title.textContent = grammar.title;
      if (explanation) explanation.textContent = grammar.explanation;
      if (examples) {
        examples.innerHTML = grammar.examples.map(ex => `<li>${ex}</li>`).join('');
      }
    }
  }

  initReadingPage() {
    const prevBtn = qs('#prevReading');
    const nextBtn = qs('#nextReading');
    
    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        this.currentReadingIndex = Math.max(0, this.currentReadingIndex - 1);
        this.updateReading();
      });
    }
    
    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        this.currentReadingIndex++;
        this.updateReading();
      });
    }

    this.updateReading();
  }

  updateReading() {
    const sentences = this.nceData.getSentences(this.selectedBooks);
    if (sentences.length > 0) {
      const index = this.currentReadingIndex % sentences.length;
      const sentence = sentences[index];
      
      const text = qs('#readingText');
      const translation = qs('#readingTranslation');
      
      if (text) text.textContent = sentence.english;
      if (translation) translation.textContent = sentence.chinese;
    }
  }

  initCoursesPage() {
    new NCESystem();
  }

  updateDailyStats(action) {
    const today = new Date().toDateString();
    const dailyKey = 'dailyWordStats';
    const dailyStats = this.getDailyStats();
    
    dailyStats[today].studied++;
    if (action === 'remember') {
      dailyStats[today].remembered++;
    } else if (action === 'fuzzy') {
      dailyStats[today].fuzzy++;
    } else if (action === 'forget') {
      dailyStats[today].forgotten++;
    }
    
    localStorage.setItem(dailyKey, JSON.stringify(dailyStats));
  }

  loadAiConfig() {
    const saved = localStorage.getItem('aiConfig');
    if (saved) {
      try {
        this.aiConfig = { ...this.aiConfig, ...JSON.parse(saved) };
      } catch (e) {
        console.error('加载AI配置失败:', e);
      }
    }
  }

  saveAiConfig() {
    localStorage.setItem('aiConfig', JSON.stringify(this.aiConfig));
  }

  initChatPage() {
    console.log('初始化Chat页面...');
    try {
      this.initChatModeSelector();
      this.initChatInput();
      this.initImageUpload();
      this.initVoiceInput();
      this.initVoiceCall();
      this.initNewChatButton();
      this.renderChatList();
      this.restoreChatMessages();
      console.log('Chat页面初始化完成');
    } catch (error) {
      console.error('Chat页面初始化失败:', error);
    }
  }

  initNewChatButton() {
    const newChatBtn = qs('#newChatBtn');
    if (newChatBtn) {
      newChatBtn.addEventListener('click', () => {
        this.createNewConversation();
      });
    }
  }

  initChatModeSelector() {
    const modeBtns = qsa('.mode-btn');
    modeBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        modeBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        const mode = btn.dataset.mode;
        const chatContainer = qs('.chat-container');
        const voiceCallContainer = qs('#voiceCallContainer');
        
        if (mode === 'voice') {
          if (chatContainer) chatContainer.style.display = 'none';
          if (voiceCallContainer) voiceCallContainer.style.display = 'flex';
        } else {
          if (chatContainer) chatContainer.style.display = 'flex';
          if (voiceCallContainer) voiceCallContainer.style.display = 'none';
        }
      });
    });
  }

  initChatInput() {
    const chatInput = qs('#chatInput');
    const sendBtn = qs('#sendBtn');

    if (chatInput) {
      chatInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          this.sendChatMessage();
        }
      });

      chatInput.addEventListener('input', () => {
        chatInput.style.height = 'auto';
        chatInput.style.height = Math.min(chatInput.scrollHeight, 150) + 'px';
      });
    }

    if (sendBtn) {
      sendBtn.addEventListener('click', () => this.sendChatMessage());
    }
  }

  initImageUpload() {
    const imageUpload = qs('#imageUpload');
    if (imageUpload) {
      imageUpload.addEventListener('change', (e) => {
        const files = e.target.files;
        if (files.length > 0) {
          this.handleImageUpload(files);
        }
        imageUpload.value = '';
      });
    }
  }

  handleImageUpload(files) {
    const pendingImages = [];
    
    Array.from(files).forEach(file => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          pendingImages.push(e.target.result);
          if (pendingImages.length === files.length) {
            this.sendChatMessageWithImages(pendingImages);
          }
        };
        reader.readAsDataURL(file);
      }
    });
  }

  sendChatMessageWithImages(images) {
    const chatInput = qs('#chatInput');
    const text = chatInput ? chatInput.value.trim() : '';
    
    this.addChatMessage('user', text, images);
    if (chatInput) {
      chatInput.value = '';
      chatInput.style.height = 'auto';
    }
    
    this.getAiResponse(text, images);
  }

  sendChatMessage() {
    const chatInput = qs('#chatInput');
    const text = chatInput ? chatInput.value.trim() : '';
    
    if (!text) return;
    
    this.addChatMessage('user', text);
    if (chatInput) {
      chatInput.value = '';
      chatInput.style.height = 'auto';
    }
    
    this.getAiResponse(text);
  }

  addChatMessage(role, content, images = [], tokenUsage = null) {
    const messagesContainer = qs('#chatMessages');
    if (!messagesContainer) return;

    const welcome = messagesContainer.querySelector('.chat-welcome');
    if (welcome) welcome.remove();

    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message ${role}`;

    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    avatar.textContent = role === 'ai' ? '🤖' : '👤';

    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';

    if (content) {
      const textDiv = document.createElement('div');
      textDiv.className = 'message-text';
      textDiv.innerHTML = this.formatMessage(content);
      contentDiv.appendChild(textDiv);
    }

    if (images.length > 0) {
      const imagesDiv = document.createElement('div');
      imagesDiv.className = 'message-images';
      images.forEach(imgSrc => {
        const img = document.createElement('img');
        img.src = imgSrc;
        img.className = 'message-image';
        img.addEventListener('click', () => {
          window.open(imgSrc, '_blank');
        });
        imagesDiv.appendChild(img);
      });
      contentDiv.appendChild(imagesDiv);
    }

    if (role === 'ai' && tokenUsage) {
      const tokenDiv = document.createElement('div');
      tokenDiv.className = 'token-usage';
      tokenDiv.style.cssText = 'font-size: 12px; color: var(--text-2); margin-top: 8px; padding-top: 8px; border-top: 1px solid var(--border);';
      tokenDiv.textContent = `Token Usage: ${tokenUsage.current}/${tokenUsage.total}`;
      contentDiv.appendChild(tokenDiv);
    }

    messageDiv.appendChild(avatar);
    messageDiv.appendChild(contentDiv);
    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    this.chatMessages.push({ role, content, images, timestamp: Date.now(), tokenUsage });
    this.saveCurrentConversationMessages();
  }

  saveChatConversations() {
    try {
      localStorage.setItem('chatConversations', JSON.stringify(this.chatConversations));
      localStorage.setItem('currentConversationId', this.currentConversationId || '');
    } catch (e) {
      console.error('保存对话记录失败:', e);
    }
  }

  loadChatConversations() {
    try {
      const saved = localStorage.getItem('chatConversations');
      const savedCurrentId = localStorage.getItem('currentConversationId');
      
      if (saved) {
        this.chatConversations = JSON.parse(saved);
      }
      
      if (savedCurrentId && this.chatConversations.find(c => c.id === savedCurrentId)) {
        this.currentConversationId = savedCurrentId;
      } else if (this.chatConversations.length > 0) {
        this.currentConversationId = this.chatConversations[0].id;
      } else {
        this.createNewConversation();
      }
      
      this.loadCurrentConversationMessages();
    } catch (e) {
      console.error('加载对话记录失败:', e);
      this.chatConversations = [];
      this.createNewConversation();
    }
  }

  createNewConversation() {
    const id = 'conv_' + Date.now();
    const conversation = {
      id: id,
      title: '新对话',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messages: []
    };
    
    this.chatConversations.unshift(conversation);
    
    if (this.chatConversations.length > 1000) {
      this.chatConversations = this.chatConversations.slice(0, 1000);
    }
    
    this.currentConversationId = id;
    this.chatMessages = [];
    this.saveChatConversations();
    this.renderChatList();
    this.clearChatMessages();
  }

  switchConversation(conversationId) {
    const conversation = this.chatConversations.find(c => c.id === conversationId);
    if (!conversation) return;
    
    this.currentConversationId = conversationId;
    this.loadCurrentConversationMessages();
    this.saveChatConversations();
    this.renderChatList();
  }

  deleteConversation(conversationId) {
    if (!confirm('确定要删除这个对话吗？')) return;
    
    const index = this.chatConversations.findIndex(c => c.id === conversationId);
    if (index === -1) return;
    
    this.chatConversations.splice(index, 1);
    
    if (this.currentConversationId === conversationId) {
      if (this.chatConversations.length > 0) {
        this.currentConversationId = this.chatConversations[0].id;
        this.loadCurrentConversationMessages();
      } else {
        this.createNewConversation();
      }
    }
    
    this.saveChatConversations();
    this.renderChatList();
  }

  loadCurrentConversationMessages() {
    const conversation = this.chatConversations.find(c => c.id === this.currentConversationId);
    if (conversation) {
      this.chatMessages = conversation.messages || [];
      this.clearChatMessages();
      this.restoreChatMessages();
    }
  }

  saveCurrentConversationMessages() {
    const conversation = this.chatConversations.find(c => c.id === this.currentConversationId);
    if (conversation) {
      conversation.messages = this.chatMessages;
      conversation.updatedAt = Date.now();
      
      if (conversation.messages.length > 0 && conversation.title === '新对话') {
        const firstMsg = conversation.messages[0];
        conversation.title = firstMsg.content.substring(0, 20) + (firstMsg.content.length > 20 ? '...' : '');
      }
      
      this.saveChatConversations();
      this.renderChatList();
    }
  }

  clearChatMessages() {
    const messagesContainer = qs('#chatMessages');
    if (!messagesContainer) return;
    
    messagesContainer.innerHTML = `
      <div class="chat-welcome">
        <div class="welcome-icon">🤖</div>
        <h3>Hi，我是 that！</h3>
        <p>我可以帮你学习英语，包括：</p>
        <ul>
          <li>📚 单词讲解和例句生成</li>
          <li>✍️ 作文批改和语法纠正</li>
          <li>🗣️ 口语练习和对话</li>
          <li>🎧 听力理解和分析</li>
          <li>📖 阅读材料解析</li>
        </ul>
        <p class="welcome-hint">开始对话吧！可以上传图片或直接语音通话。</p>
      </div>
    `;
  }

  restoreChatMessages() {
    const messagesContainer = qs('#chatMessages');
    if (!messagesContainer) return;

    if (this.chatMessages.length === 0) return;

    const welcome = messagesContainer.querySelector('.chat-welcome');
    if (welcome) welcome.remove();

    this.chatMessages.forEach(msg => {
      this.renderChatMessage(msg);
    });

    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  renderChatList() {
    const chatList = qs('#chatList');
    if (!chatList) return;
    
    chatList.innerHTML = '';
    
    this.chatConversations.forEach(conversation => {
      const item = document.createElement('div');
      item.className = 'chat-item' + (conversation.id === this.currentConversationId ? ' active' : '');
      
      item.innerHTML = `
        <span class="chat-item-icon">💬</span>
        <span class="chat-item-title">${this.escapeHtml(conversation.title)}</span>
        <button class="chat-item-delete" data-id="${conversation.id}">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
          </svg>
        </button>
      `;
      
      item.addEventListener('click', (e) => {
        if (!e.target.closest('.chat-item-delete')) {
          this.switchConversation(conversation.id);
        }
      });
      
      const deleteBtn = item.querySelector('.chat-item-delete');
      deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.deleteConversation(conversation.id);
      });
      
      chatList.appendChild(item);
    });
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  renderChatMessage(msg) {
    const messagesContainer = qs('#chatMessages');
    if (!messagesContainer) return;

    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message ${msg.role}`;

    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    avatar.textContent = msg.role === 'ai' ? '🤖' : '👤';

    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';

    if (msg.content) {
      const textDiv = document.createElement('div');
      textDiv.className = 'message-text';
      textDiv.innerHTML = this.formatMessage(msg.content);
      contentDiv.appendChild(textDiv);
    }

    if (msg.images && msg.images.length > 0) {
      const imagesDiv = document.createElement('div');
      imagesDiv.className = 'message-images';
      msg.images.forEach(imgSrc => {
        const img = document.createElement('img');
        img.src = imgSrc;
        img.className = 'message-image';
        img.addEventListener('click', () => {
          window.open(imgSrc, '_blank');
        });
        imagesDiv.appendChild(img);
      });
      contentDiv.appendChild(imagesDiv);
    }

    if (msg.role === 'ai' && msg.tokenUsage) {
      const tokenDiv = document.createElement('div');
      tokenDiv.className = 'token-usage';
      tokenDiv.style.cssText = 'font-size: 12px; color: var(--text-2); margin-top: 8px; padding-top: 8px; border-top: 1px solid var(--border);';
      tokenDiv.textContent = `Token Usage: ${msg.tokenUsage.current}/${msg.tokenUsage.total}`;
      contentDiv.appendChild(tokenDiv);
    }

    messageDiv.appendChild(avatar);
    messageDiv.appendChild(contentDiv);
    messagesContainer.appendChild(messageDiv);
  }

  formatMessage(text) {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\n/g, '<br>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>');
  }

  async getAiResponse(userMessage, images = []) {
    const thinkingDiv = document.createElement('div');
    thinkingDiv.className = 'chat-message ai';
    thinkingDiv.innerHTML = `
      <div class="message-avatar">🤖</div>
      <div class="message-content">
        <div class="message-text">思考中...</div>
      </div>
    `;
    
    const messagesContainer = qs('#chatMessages');
    if (messagesContainer) {
      messagesContainer.appendChild(thinkingDiv);
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    try {
      let result = null;
      
      if (this.aiConfig.serviceMode === 'local') {
        const content = await this.callOllama(userMessage, images);
        result = { content: content, tokenUsage: null };
      } else {
        result = await this.callCloudApi(userMessage, images);
      }

      if (thinkingDiv.parentNode) {
        thinkingDiv.remove();
      }
      
      this.addChatMessage('ai', result.content, [], result.tokenUsage);
      
      if (this.currentPage === 'chat' && this.aiConfig.autoSpeakAiResponse) {
        this.speakResponse(result.content);
      }
    } catch (error) {
      console.error('AI响应错误:', error);
      if (thinkingDiv.parentNode) {
        thinkingDiv.remove();
      }
      this.addChatMessage('ai', '抱歉，发生了错误。请检查AI配置或稍后重试。');
    }
  }

  async callCloudApi(userMessage, images = []) {
    const { apiKey, apiUrl, model, provider } = this.aiConfig;
    
    if (!apiKey) {
      throw new Error('请先在设置中配置API Key');
    }

    if (provider === 'gemini') {
      return await this.callGeminiApi(userMessage, images);
    }

    const messages = [
      {
        role: 'system',
        content: '你是一个专业的英语学习助手。请用中文回答，帮助用户学习英语。'
      },
      {
        role: 'user',
        content: userMessage
      }
    ];

    const response = await fetch(`${apiUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: model,
        messages: messages,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      throw new Error(`API请求失败: ${response.status}`);
    }

    const data = await response.json();
    
    let tokenUsage = null;
    if (data.usage) {
      tokenUsage = this.updateTokenUsage(provider, data.usage.prompt_tokens, data.usage.completion_tokens);
    }
    
    return {
      content: data.choices[0].message.content,
      tokenUsage: tokenUsage
    };
  }

  updateTokenUsage(provider, promptTokens, completionTokens) {
    if (!this.aiConfig.tokenUsage[provider]) {
      this.aiConfig.tokenUsage[provider] = {
        totalPromptTokens: 0,
        totalCompletionTokens: 0,
        totalTokens: 0
      };
    }
    
    const usage = this.aiConfig.tokenUsage[provider];
    usage.totalPromptTokens += promptTokens;
    usage.totalCompletionTokens += completionTokens;
    usage.totalTokens += promptTokens + completionTokens;
    
    this.saveAiConfig();
    
    return {
      current: promptTokens + completionTokens,
      total: usage.totalTokens
    };
  }

  async callGeminiApi(userMessage, images = []) {
    const { apiKey, apiUrl, model } = this.aiConfig;
    
    const geminiUrl = `${apiUrl}/v1beta/models/${model}:generateContent?key=${apiKey}`;
    
    const contents = [
      {
        role: 'user',
        parts: [
          {
            text: '你是一个专业的英语学习助手。请用中文回答，帮助用户学习英语。'
          }
        ]
      },
      {
        role: 'model',
        parts: [
          {
            text: '好的，我是一个专业的英语学习助手，我会用中文回答，帮助你学习英语。请问有什么可以帮到你的？'
          }
        ]
      },
      {
        role: 'user',
        parts: [
          {
            text: userMessage
          }
        ]
      }
    ];

    const response = await fetch(geminiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: contents,
        generationConfig: {
          temperature: 0.7
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Gemini API请求失败: ${response.status} - ${errorData.error?.message || '未知错误'}`);
    }

    const data = await response.json();
    
    let tokenUsage = null;
    if (data.usageMetadata) {
      const promptTokens = data.usageMetadata.promptTokenCount || 0;
      const completionTokens = data.usageMetadata.candidatesTokenCount || 0;
      tokenUsage = this.updateTokenUsage('gemini', promptTokens, completionTokens);
    }
    
    if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts) {
      return {
        content: data.candidates[0].content.parts.map(part => part.text).join(''),
        tokenUsage: tokenUsage
      };
    }
    throw new Error('Gemini API返回格式错误');
  }

  async callOllama(userMessage, images = []) {
    const { ollamaUrl, ollamaModel } = this.aiConfig;
    
    const response = await fetch(`${ollamaUrl}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: ollamaModel,
        messages: [
          {
            role: 'system',
            content: '你是一个专业的英语学习助手。请用中文回答，帮助用户学习英语。'
          },
          {
            role: 'user',
            content: userMessage
          }
        ],
        stream: false
      })
    });

    if (!response.ok) {
      throw new Error(`Ollama请求失败: ${response.status}`);
    }

    const data = await response.json();
    return data.message.content;
  }

  initVoiceInput() {
    const voiceBtn = qs('#voiceBtn');
    if (!voiceBtn) return;

    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = false;
      this.recognition.interimResults = true;
      this.recognition.lang = 'zh-CN';

      this.recognition.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map(result => result[0].transcript)
          .join('');
        
        const chatInput = qs('#chatInput');
        if (chatInput) {
          chatInput.value = transcript;
        }
      };

      this.recognition.onend = () => {
        this.isRecording = false;
        voiceBtn.classList.remove('recording');
      };

      voiceBtn.addEventListener('click', () => {
        if (this.isRecording) {
          this.recognition.stop();
        } else {
          this.recognition.start();
          this.isRecording = true;
          voiceBtn.classList.add('recording');
        }
      });
    } else {
      voiceBtn.style.display = 'none';
    }
  }

  speakResponse(text) {
    if (!this.synthesis) return;
    
    this.synthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'zh-CN';
    utterance.rate = 0.9;
    
    this.synthesis.speak(utterance);
  }

  initVoiceCall() {
    const endCallBtn = qs('#endCallBtn');
    const muteBtn = qs('#muteBtn');
    const speakerBtn = qs('#speakerBtn');

    if (endCallBtn) {
      endCallBtn.addEventListener('click', () => this.endVoiceCall());
    }

    if (muteBtn) {
      muteBtn.addEventListener('click', () => {
        this.isMuted = !this.isMuted;
        muteBtn.classList.toggle('muted', this.isMuted);
      });
    }

    if (speakerBtn) {
      speakerBtn.addEventListener('click', () => {
        this.isSpeakerOn = !this.isSpeakerOn;
        speakerBtn.classList.toggle('speaker-on', this.isSpeakerOn);
      });
    }

    const modeBtns = qsa('.mode-btn');
    modeBtns.forEach(btn => {
      if (btn.dataset.mode === 'voice') {
        btn.addEventListener('click', () => {
          this.startVoiceCall();
        });
      }
    });
  }

  async startVoiceCall() {
    const callStatus = qs('#callStatus');
    if (callStatus) callStatus.textContent = '连接中...';

    try {
      this.isCallActive = true;
      if (callStatus) callStatus.textContent = '通话中...';
      
      this.startVoiceListening();
    } catch (error) {
      console.error('语音通话启动失败:', error);
      if (callStatus) callStatus.textContent = '连接失败';
      this.isCallActive = false;
    }
  }

  async startVoiceListening() {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = 'zh-CN';

    recognition.onresult = async (event) => {
      if (this.isMuted || !this.isCallActive) return;
      
      const transcript = Array.from(event.results)
        .map(result => result[0].transcript)
        .join('');

      if (transcript.trim()) {
        this.addChatMessage('user', transcript);
        const response = await this.getAiResponse(transcript);
        
        if (this.isSpeakerOn && this.isCallActive) {
          this.speakResponse(response);
        }
      }
    };

    recognition.onerror = (event) => {
      console.error('语音识别错误:', event.error);
    };

    recognition.start();
    this.voiceRecognition = recognition;
  }

  endVoiceCall() {
    this.isCallActive = false;
    
    if (this.voiceRecognition) {
      this.voiceRecognition.stop();
    }
    
    if (this.synthesis) {
      this.synthesis.cancel();
    }

    const callStatus = qs('#callStatus');
    if (callStatus) callStatus.textContent = '通话已结束';

    const modeBtns = qsa('.mode-btn');
    modeBtns.forEach(btn => {
      if (btn.dataset.mode === 'text') {
        btn.click();
      }
    });
  }

  initAiConfig() {
    const serviceMode = qs('#aiServiceMode');
    const cloudConfig = qs('#cloudConfig');
    const apiKeyConfig = qs('#apiKeyConfig');
    const apiUrlConfig = qs('#apiUrlConfig');
    const modelConfig = qs('#modelConfig');
    const ollamaConfig = qs('#ollamaConfig');
    const ollamaModelConfig = qs('#ollamaModelConfig');
    const aiProvider = qs('#aiProvider');
    const aiApiKey = qs('#aiApiKey');
    const aiApiUrl = qs('#aiApiUrl');
    const aiModel = qs('#aiModel');
    const ollamaUrl = qs('#ollamaUrl');
    const ollamaModel = qs('#ollamaModel');
    const refreshOllamaModels = qs('#refreshOllamaModels');
    const autoSpeakAiResponse = qs('#autoSpeakAiResponse');
    const testBtn = qs('#testAiConnection');
    const connectionStatus = qs('#connectionStatus');

    if (serviceMode) {
      serviceMode.value = this.aiConfig.serviceMode;
      serviceMode.addEventListener('change', (e) => {
        this.aiConfig.serviceMode = e.target.value;
        this.saveAiConfig();
        this.updateAiConfigUI();
        if (e.target.value === 'local') {
          this.loadOllamaModels();
        }
      });
    }

    if (aiProvider) {
      aiProvider.value = this.aiConfig.provider;
      aiProvider.addEventListener('change', async (e) => {
        this.aiConfig.provider = e.target.value;
        await this.updateProviderDefaults(e.target.value);
        this.saveAiConfig();
        this.updateModelSelect(e.target.value);
      });
    }

    if (aiApiKey) {
      aiApiKey.value = this.aiConfig.apiKey;
      aiApiKey.addEventListener('input', async (e) => {
        this.aiConfig.apiKey = e.target.value;
        this.saveAiConfig();
        if (this.aiConfig.provider === 'gemini' && e.target.value) {
          await this.updateProviderDefaults('gemini');
        }
      });
    }

    if (aiApiUrl) {
      aiApiUrl.value = this.aiConfig.apiUrl;
      aiApiUrl.addEventListener('input', (e) => {
        this.aiConfig.apiUrl = e.target.value;
        this.saveAiConfig();
      });
    }

    if (aiModel) {
      this.updateModelSelect(this.aiConfig.provider);
      aiModel.addEventListener('change', (e) => {
        this.aiConfig.model = e.target.value;
        this.saveAiConfig();
      });
    }

    const addModelBtn = qs('#addModelBtn');
    if (addModelBtn) {
      addModelBtn.addEventListener('click', () => this.addModel());
    }

    const newModelInput = qs('#newModelInput');
    if (newModelInput) {
      newModelInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          this.addModel();
        }
      });
    }

    const deleteModelBtn = qs('#deleteModelBtn');
    if (deleteModelBtn) {
      deleteModelBtn.addEventListener('click', () => this.deleteModel());
    }

    if (ollamaUrl) {
      ollamaUrl.value = this.aiConfig.ollamaUrl;
      ollamaUrl.addEventListener('input', (e) => {
        this.aiConfig.ollamaUrl = e.target.value;
        this.saveAiConfig();
      });
    }

    if (ollamaModel) {
      ollamaModel.addEventListener('change', (e) => {
        this.aiConfig.ollamaModel = e.target.value;
        this.saveAiConfig();
      });
    }

    if (refreshOllamaModels) {
      refreshOllamaModels.addEventListener('click', () => {
        this.loadOllamaModels();
      });
    }

    if (autoSpeakAiResponse) {
      autoSpeakAiResponse.checked = this.aiConfig.autoSpeakAiResponse;
      autoSpeakAiResponse.addEventListener('change', (e) => {
        this.aiConfig.autoSpeakAiResponse = e.target.checked;
        this.saveAiConfig();
      });
    }

    if (testBtn) {
      testBtn.addEventListener('click', async () => {
        const testErrorDetails = qs('#testErrorDetails');
        const testErrorContent = qs('#testErrorContent');
        
        if (testErrorDetails) testErrorDetails.style.display = 'none';
        if (connectionStatus) {
          connectionStatus.textContent = '测试中...';
          connectionStatus.className = 'connection-status';
        }
        
        try {
          await this.testAiConnection();
          if (connectionStatus) {
            connectionStatus.textContent = '✓ 连接成功';
            connectionStatus.className = 'connection-status success';
          }
        } catch (error) {
          if (connectionStatus) {
            connectionStatus.textContent = '✗ 连接失败';
            connectionStatus.className = 'connection-status error';
          }
          if (testErrorDetails && testErrorContent) {
            testErrorDetails.style.display = 'block';
            testErrorContent.textContent = error.message + '\n\n' + (error.stack || '');
          }
        }
      });
    }

    this.updateAiConfigUI();
  }

  async loadOllamaModels() {
    const ollamaModel = qs('#ollamaModel');
    if (!ollamaModel) return;
    
    try {
      ollamaModel.innerHTML = '<option value="">加载中...</option>';
      
      const response = await fetch(`${this.aiConfig.ollamaUrl}/api/tags`);
      if (!response.ok) throw new Error('获取模型列表失败');
      
      const data = await response.json();
      const models = data.models || [];
      
      ollamaModel.innerHTML = '';
      
      if (models.length === 0) {
        ollamaModel.innerHTML = '<option value="">没有找到模型</option>';
      } else {
        models.forEach(model => {
          const option = document.createElement('option');
          option.value = model.name;
          option.textContent = model.name;
          if (model.name === this.aiConfig.ollamaModel) {
            option.selected = true;
          }
          ollamaModel.appendChild(option);
        });
        
        if (!this.aiConfig.ollamaModel && models.length > 0) {
          this.aiConfig.ollamaModel = models[0].name;
          ollamaModel.value = this.aiConfig.ollamaModel;
          this.saveAiConfig();
        }
      }
    } catch (error) {
      console.error('加载Ollama模型失败:', error);
      ollamaModel.innerHTML = '<option value="">加载失败</option>';
    }
  }

  updateAiConfigUI() {
    const cloudConfig = qs('#cloudConfig');
    const apiKeyConfig = qs('#apiKeyConfig');
    const apiUrlConfig = qs('#apiUrlConfig');
    const modelConfig = qs('#modelConfig');
    const ollamaConfig = qs('#ollamaConfig');
    const ollamaModelConfig = qs('#ollamaModelConfig');

    if (this.aiConfig.serviceMode === 'local') {
      if (cloudConfig) cloudConfig.style.display = 'none';
      if (apiKeyConfig) apiKeyConfig.style.display = 'none';
      if (apiUrlConfig) apiUrlConfig.style.display = 'none';
      if (modelConfig) modelConfig.style.display = 'none';
      if (ollamaConfig) ollamaConfig.style.display = 'block';
      if (ollamaModelConfig) ollamaModelConfig.style.display = 'block';
      this.loadOllamaModels();
    } else {
      if (cloudConfig) cloudConfig.style.display = 'block';
      if (apiKeyConfig) apiKeyConfig.style.display = 'block';
      if (apiUrlConfig) apiUrlConfig.style.display = 'block';
      if (modelConfig) modelConfig.style.display = 'block';
      if (ollamaConfig) ollamaConfig.style.display = 'none';
      if (ollamaModelConfig) ollamaModelConfig.style.display = 'none';
      this.updateModelSelect(this.aiConfig.provider);
    }
  }

  loadModelLists() {
    const saved = localStorage.getItem('modelLists');
    const defaultLists = {
      openai: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo'],
      anthropic: ['claude-3-5-sonnet-20241022', 'claude-3-opus', 'claude-3-sonnet', 'claude-3-haiku'],
      deepseek: ['deepseek-chat', 'deepseek-coder'],
      qwen: ['qwen-plus', 'qwen-turbo', 'qwen-max'],
      gemini: ['gemini-3.1-pro-preview', 'gemini-1.5-pro', 'gemini-1.5-flash'],
      custom: []
    };

    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.gemini && (parsed.gemini.includes('gemini-2.0-flash') || parsed.gemini.includes('gemini-1.0-pro'))) {
          localStorage.setItem('modelLists', JSON.stringify(defaultLists));
          return defaultLists;
        }
        return parsed;
      } catch (e) {
        return defaultLists;
      }
    }
    return defaultLists;
  }

  saveModelLists() {
    localStorage.setItem('modelLists', JSON.stringify(this.modelLists));
  }

  updateModelSelect(provider) {
    const aiModel = qs('#aiModel');
    if (!aiModel) return;

    const models = this.modelLists[provider] || [];
    aiModel.innerHTML = '';
    
    models.forEach(model => {
      const option = document.createElement('option');
      option.value = model;
      option.textContent = model;
      if (model === this.aiConfig.model) {
        option.selected = true;
      }
      aiModel.appendChild(option);
    });

    if (models.length === 0) {
      const option = document.createElement('option');
      option.value = '';
      option.textContent = '请添加模型';
      aiModel.appendChild(option);
    }
  }

  addModel() {
    const provider = this.aiConfig.provider;
    const newModelInput = qs('#newModelInput');
    const modelName = newModelInput?.value;
    
    if (!modelName || !modelName.trim()) return;

    const trimmedName = modelName.trim();
    if (!this.modelLists[provider]) {
      this.modelLists[provider] = [];
    }

    if (!this.modelLists[provider].includes(trimmedName)) {
      this.modelLists[provider].push(trimmedName);
      this.saveModelLists();
      this.updateModelSelect(provider);
      this.aiConfig.model = trimmedName;
      this.saveAiConfig();
      
      if (newModelInput) {
        newModelInput.value = '';
      }
    } else {
      alert('该模型已存在！');
    }
  }

  deleteModel() {
    const provider = this.aiConfig.provider;
    const aiModel = qs('#aiModel');
    if (!aiModel || !aiModel.value) return;

    const modelName = aiModel.value;
    if (!confirm(`确定要删除模型 "${modelName}" 吗？`)) return;

    const index = this.modelLists[provider]?.indexOf(modelName);
    if (index > -1) {
      this.modelLists[provider].splice(index, 1);
      this.saveModelLists();
      
      if (this.modelLists[provider].length > 0) {
        this.aiConfig.model = this.modelLists[provider][0];
      } else {
        this.aiConfig.model = '';
      }
      this.saveAiConfig();
      this.updateModelSelect(provider);
    }
  }

  async updateProviderDefaults(provider) {
    const defaults = {
      openai: { apiUrl: 'https://api.openai.com/v1', model: 'gpt-4o' },
      anthropic: { apiUrl: 'https://api.anthropic.com/v1', model: 'claude-3-5-sonnet-20241022' },
      deepseek: { apiUrl: 'https://api.deepseek.com/v1', model: 'deepseek-chat' },
      qwen: { apiUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1', model: 'qwen-plus' },
      gemini: { apiUrl: 'https://generativelanguage.googleapis.com', model: 'gemini-1.5-flash' },
      custom: { apiUrl: '', model: '' }
    };

    const config = defaults[provider] || defaults.openai;
    this.aiConfig.apiUrl = config.apiUrl;
    
    if (provider === 'gemini' && this.aiConfig.apiKey) {
      try {
        const listModelsUrl = `${config.apiUrl}/v1beta/models?key=${this.aiConfig.apiKey}`;
        const listResponse = await fetch(listModelsUrl);
        
        if (listResponse.ok) {
          const modelData = await listResponse.json();
          console.log('可用的 Gemini 模型:', modelData.models);
          
          const availableModels = modelData.models?.filter(m => 
            m.supportedGenerationMethods?.includes('generateContent')
          ).map(m => m.name.replace('models/', '')) || [];
          
          if (availableModels.length > 0) {
            this.modelLists.gemini = availableModels;
            this.saveModelLists();
            
            if (!this.aiConfig.model || !availableModels.includes(this.aiConfig.model)) {
              this.aiConfig.model = availableModels[0];
              this.saveAiConfig();
            }
          }
        }
      } catch (e) {
        console.log('获取 Gemini 模型列表失败:', e);
      }
    }
    
    if (!this.aiConfig.model || !this.modelLists[provider]?.includes(this.aiConfig.model)) {
      this.aiConfig.model = config.model;
    }

    const aiApiUrl = qs('#aiApiUrl');
    
    if (aiApiUrl) aiApiUrl.value = config.apiUrl;
    this.updateModelSelect(provider);
  }

  async testAiConnection() {
    if (this.aiConfig.serviceMode === 'local') {
      const response = await fetch(`${this.aiConfig.ollamaUrl}/api/tags`);
      if (!response.ok) throw new Error('Ollama连接失败');
    } else {
      if (!this.aiConfig.apiKey) {
        throw new Error('请先配置API Key');
      }
      
      if (this.aiConfig.provider === 'gemini') {
        const { apiKey, apiUrl, model } = this.aiConfig;
        
        const listModelsUrl = `${apiUrl}/v1beta/models?key=${apiKey}`;
        const listResponse = await fetch(listModelsUrl);
        
        if (!listResponse.ok) {
          const errorData = await listResponse.json().catch(() => ({}));
          throw new Error('Gemini连接失败: ' + (errorData.error?.message || '无法获取模型列表'));
        }
        
        const modelData = await listResponse.json();
        console.log('可用的 Gemini 模型:', modelData.models);
        
        const availableModels = modelData.models?.filter(m => 
          m.supportedGenerationMethods?.includes('generateContent')
        ).map(m => m.name.replace('models/', '')) || [];
        
        if (availableModels.length === 0) {
          throw new Error('没有找到可用的 Gemini 模型');
        }
        
        if (!availableModels.includes(model)) {
          throw new Error(`模型 "${model}" 不可用。可用的模型: ${availableModels.join(', ')}`);
        }
        
        const geminiUrl = `${apiUrl}/v1beta/models/${model}:generateContent?key=${apiKey}`;
        const testResponse = await fetch(geminiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            contents: [
              {
                role: 'user',
                parts: [{ text: 'Hi' }]
              }
            ],
            generationConfig: {
              maxOutputTokens: 5
            }
          })
        });
        
        if (!testResponse.ok) {
          const errorData = await testResponse.json().catch(() => ({}));
          throw new Error('Gemini连接失败: ' + (errorData.error?.message || '未知错误'));
        }
      } else {
        const { apiKey, apiUrl, model } = this.aiConfig;
        const testResponse = await fetch(`${apiUrl}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model: model,
            messages: [{ role: 'user', content: 'Hi' }],
            max_tokens: 5
          })
        });
        
        if (!testResponse.ok) throw new Error('API连接失败');
      }
    }
    return true;
  }

  loadCheckinData() {
    const savedGoals = localStorage.getItem('checkinGoals');
    const savedRecords = localStorage.getItem('checkinRecords');
    
    if (savedGoals) {
      this.checkinGoals = JSON.parse(savedGoals);
    } else {
      this.checkinGoals = [
        {
          id: '1',
          name: '雅思7',
          description: '雅思备考，目标7分',
          type: 'daily',
          createdAt: new Date().toISOString(),
          active: true
        },
        {
          id: '2',
          name: '新概念1册',
          description: '学习新概念英语第一册',
          type: 'daily',
          createdAt: new Date().toISOString(),
          active: true
        },
        {
          id: '3',
          name: '英语泛听 500 hours',
          description: '累计英语泛听500小时',
          type: 'daily',
          createdAt: new Date().toISOString(),
          active: true
        }
      ];
      this.saveCheckinData();
    }
    
    if (savedRecords) {
      this.checkinRecords = JSON.parse(savedRecords);
    }
  }

  saveCheckinData() {
    localStorage.setItem('checkinGoals', JSON.stringify(this.checkinGoals));
    localStorage.setItem('checkinRecords', JSON.stringify(this.checkinRecords));
  }

  initCheckinFeature() {
    this.renderCheckinGoals();
    this.updateCheckinStats();
    this.initCheckinEventListeners();
  }

  initCheckinEventListeners() {
    const addGoalBtn = qs('#addGoalBtn');
    if (addGoalBtn) {
      addGoalBtn.addEventListener('click', () => this.openGoalModal());
    }

    const closeGoalModal = qs('#closeGoalModal');
    if (closeGoalModal) {
      closeGoalModal.addEventListener('click', () => this.closeGoalModal());
    }

    const cancelGoalBtn = qs('#cancelGoalBtn');
    if (cancelGoalBtn) {
      cancelGoalBtn.addEventListener('click', () => this.closeGoalModal());
    }

    const saveGoalBtn = qs('#saveGoalBtn');
    if (saveGoalBtn) {
      saveGoalBtn.addEventListener('click', () => this.saveGoal());
    }

    const goalModal = qs('#goalModal');
    if (goalModal) {
      goalModal.addEventListener('click', (e) => {
        if (e.target === goalModal) {
          this.closeGoalModal();
        }
      });
    }
  }

  openGoalModal(goalId = null) {
    const modal = qs('#goalModal');
    const title = qs('#goalModalTitle');
    const nameInput = qs('#goalName');
    const descInput = qs('#goalDescription');
    const typeInput = qs('#goalType');

    if (goalId) {
      const goal = this.checkinGoals.find(g => g.id === goalId);
      if (goal) {
        this.editingGoalId = goalId;
        title.textContent = '编辑目标';
        nameInput.value = goal.name;
        descInput.value = goal.description || '';
        typeInput.value = goal.type;
      }
    } else {
      this.editingGoalId = null;
      title.textContent = '添加目标';
      nameInput.value = '';
      descInput.value = '';
      typeInput.value = 'daily';
    }

    modal.classList.add('active');
  }

  closeGoalModal() {
    const modal = qs('#goalModal');
    modal.classList.remove('active');
    this.editingGoalId = null;
  }

  saveGoal() {
    const nameInput = qs('#goalName');
    const descInput = qs('#goalDescription');
    const typeInput = qs('#goalType');

    const name = nameInput.value.trim();
    if (!name) {
      alert('请输入目标名称');
      return;
    }

    if (this.editingGoalId) {
      const goal = this.checkinGoals.find(g => g.id === this.editingGoalId);
      if (goal) {
        goal.name = name;
        goal.description = descInput.value.trim();
        goal.type = typeInput.value;
      }
    } else {
      const newGoal = {
        id: Date.now().toString(),
        name: name,
        description: descInput.value.trim(),
        type: typeInput.value,
        createdAt: new Date().toISOString(),
        active: true
      };
      this.checkinGoals.push(newGoal);
    }

    this.saveCheckinData();
    this.renderCheckinGoals();
    this.updateCheckinStats();
    this.closeGoalModal();
  }

  deleteGoal(goalId) {
    if (!confirm('确定要删除这个目标吗？')) {
      return;
    }
    this.checkinGoals = this.checkinGoals.filter(g => g.id !== goalId);
    this.checkinRecords = this.checkinRecords.filter(r => r.goalId !== goalId);
    this.saveCheckinData();
    this.renderCheckinGoals();
    this.updateCheckinStats();
  }

  toggleCheckin(goalId) {
    const today = this.getTodayString();
    const existingRecord = this.checkinRecords.find(
      r => r.goalId === goalId && r.date === today
    );

    if (existingRecord) {
      this.checkinRecords = this.checkinRecords.filter(r => r !== existingRecord);
    } else {
      const now = new Date();
      const newRecord = {
        id: Date.now().toString(),
        goalId: goalId,
        date: today,
        time: now.toTimeString().slice(0, 8),
        timestamp: now.toISOString()
      };
      this.checkinRecords.push(newRecord);
    }

    this.saveCheckinData();
    this.renderCheckinGoals();
    this.updateCheckinStats();
  }

  isCheckedInToday(goalId) {
    const today = this.getTodayString();
    return this.checkinRecords.some(
      r => r.goalId === goalId && r.date === today
    );
  }

  getTodayString() {
    const today = new Date();
    return today.toISOString().split('T')[0];
  }

  renderCheckinGoals() {
    const container = qs('#checkinGoalsList');
    if (!container) return;

    const activeGoals = this.checkinGoals.filter(g => g.active);
    
    if (activeGoals.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 20px; color: var(--ink-3);">
          还没有添加目标，点击"添加目标"开始吧！
        </div>
      `;
      return;
    }

    container.innerHTML = activeGoals.map(goal => {
      const isChecked = this.isCheckedInToday(goal.id);
      const typeLabel = this.getGoalTypeLabel(goal.type);
      
      return `
        <div class="goal-item ${isChecked ? 'completed' : ''}" data-goal-id="${goal.id}">
          <div class="goal-info">
            <div class="goal-name">${goal.name}</div>
            ${goal.description ? `<div class="goal-description">${goal.description}</div>` : ''}
            <span class="goal-type">${typeLabel}</span>
          </div>
          <div class="goal-actions">
            <button class="checkin-btn ${isChecked ? 'checked' : ''}" data-goal-id="${goal.id}">
              ${isChecked ? '✓ 已打卡' : '打卡'}
            </button>
            <button class="delete-goal-btn" data-goal-id="${goal.id}" title="删除目标">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              </svg>
            </button>
          </div>
        </div>
      `;
    }).join('');

    container.querySelectorAll('.checkin-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const goalId = e.currentTarget.dataset.goalId;
        this.toggleCheckin(goalId);
      });
    });

    container.querySelectorAll('.delete-goal-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const goalId = e.currentTarget.dataset.goalId;
        this.deleteGoal(goalId);
      });
    });
  }

  getGoalTypeLabel(type) {
    const labels = {
      daily: '每日',
      weekly: '每周',
      custom: '自定义'
    };
    return labels[type] || type;
  }

  updateCheckinStats() {
    const today = this.getTodayString();
    
    const totalCheckins = this.checkinRecords.length;
    const todayCheckins = this.checkinRecords.filter(r => r.date === today).length;
    const streakDays = this.calculateStreak();

    const streakEl = qs('#streakDays');
    const totalEl = qs('#totalCheckins');
    const todayEl = qs('#todayCheckins');

    if (streakEl) streakEl.textContent = streakDays;
    if (totalEl) totalEl.textContent = totalCheckins;
    if (todayEl) todayEl.textContent = todayCheckins;
  }

  calculateStreak() {
    if (this.checkinRecords.length === 0) {
      return 0;
    }

    const uniqueDates = [...new Set(this.checkinRecords.map(r => r.date))].sort().reverse();
    
    if (uniqueDates.length === 0) return 0;

    let streak = 0;
    let currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    for (let i = 0; i < uniqueDates.length; i++) {
      const checkDate = new Date(uniqueDates[i]);
      checkDate.setHours(0, 0, 0, 0);

      const diffDays = Math.floor((currentDate - checkDate) / (1000 * 60 * 60 * 24));

      if (diffDays === i) {
        streak++;
      } else {
        break;
      }
    }

    return streak;
  }

  initHomeEditMode() {
    const editToggle = qs('#homeEditModeToggle');
    const resetBtn = qs('#resetHomeLayout');

    if (editToggle) {
      editToggle.addEventListener('click', () => this.toggleHomeEditMode());
    }

    if (resetBtn) {
      resetBtn.addEventListener('click', () => this.resetCardLayouts());
    }

    document.addEventListener('mousemove', (e) => this.handleMouseMove(e));
    document.addEventListener('mouseup', () => this.handleMouseUp());
  }

  toggleHomeEditMode() {
    this.homeEditMode = !this.homeEditMode;
    const containers = qsa('.draggable-container');
    const editToggle = qs('#homeEditModeToggle');

    containers.forEach(container => {
      if (this.homeEditMode) {
        container.classList.add('edit-mode');
        this.addResizeHandles(container);
      } else {
        container.classList.remove('edit-mode');
        this.removeResizeHandles(container);
      }
    });

    if (editToggle) {
      editToggle.textContent = this.homeEditMode ? '完成编辑' : '编辑布局';
      editToggle.innerHTML = this.homeEditMode 
        ? '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17l-5-5"></polyline></svg> 完成编辑'
        : '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg> 编辑布局';
    }
  }

  addResizeHandles(container) {
    container.style.position = 'relative';
    container.style.minHeight = '600px';
    
    const cards = container.querySelectorAll('.draggable-card');
    cards.forEach(card => {
      if (!card.querySelector('.resize-handle')) {
        const handle = document.createElement('div');
        handle.className = 'resize-handle';
        handle.addEventListener('mousedown', (e) => this.startResize(e, card));
        card.appendChild(handle);
      }
      
      const cardHandle = card.querySelector('.card-handle');
      if (cardHandle) {
        cardHandle.addEventListener('mousedown', (e) => this.startDrag(e, card));
      }
    });
  }

  removeResizeHandles(container) {
    const handles = container.querySelectorAll('.resize-handle');
    handles.forEach(handle => handle.remove());
  }

  startDrag(e, card) {
    if (!this.homeEditMode) return;
    e.preventDefault();
    e.stopPropagation();

    this.draggingCard = card;
    const rect = card.getBoundingClientRect();
    this.dragOffset = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };

    card.classList.add('dragging');
    card.style.position = 'absolute';
    card.style.zIndex = '1000';
  }

  startResize(e, card) {
    if (!this.homeEditMode) return;
    e.preventDefault();
    e.stopPropagation();

    this.resizingCard = card;
    const rect = card.getBoundingClientRect();
    this.resizeStart = {
      x: e.clientX,
      y: e.clientY,
      width: rect.width,
      height: rect.height
    };

    card.classList.add('resizing');
    if (!card.style.width) {
      card.style.width = rect.width + 'px';
    }
    if (!card.style.height) {
      card.style.height = rect.height + 'px';
    }
  }

  handleMouseMove(e) {
    if (this.draggingCard) {
      const container = this.draggingCard.parentElement;
      const containerRect = container.getBoundingClientRect();

      let x = e.clientX - containerRect.left - this.dragOffset.x;
      let y = e.clientY - containerRect.top - this.dragOffset.y;

      x = Math.max(0, Math.min(x, containerRect.width - this.draggingCard.offsetWidth));
      y = Math.max(0, Math.min(y, containerRect.height - this.draggingCard.offsetHeight));

      this.draggingCard.style.left = x + 'px';
      this.draggingCard.style.top = y + 'px';
    }

    if (this.resizingCard) {
      const deltaX = e.clientX - this.resizeStart.x;
      const deltaY = e.clientY - this.resizeStart.y;

      const newWidth = Math.max(200, this.resizeStart.width + deltaX);
      const newHeight = Math.max(100, this.resizeStart.height + deltaY);

      this.resizingCard.style.width = newWidth + 'px';
      this.resizingCard.style.height = newHeight + 'px';
    }
  }

  handleMouseUp() {
    if (this.draggingCard) {
      this.draggingCard.classList.remove('dragging');
      this.draggingCard.style.zIndex = '';
      this.saveCardLayout(this.draggingCard);
      this.draggingCard = null;
    }

    if (this.resizingCard) {
      this.resizingCard.classList.remove('resizing');
      this.saveCardLayout(this.resizingCard);
      this.resizingCard = null;
    }
  }

  saveCardLayout(card) {
    const cardId = card.dataset.cardId;
    if (!cardId) return;

    const layout = {
      left: card.style.left,
      top: card.style.top,
      width: card.style.width,
      height: card.style.height
    };

    const savedLayouts = this.loadSavedLayouts();
    savedLayouts[cardId] = layout;
    localStorage.setItem('cardLayouts', JSON.stringify(savedLayouts));
  }

  loadSavedLayouts() {
    const saved = localStorage.getItem('cardLayouts');
    return saved ? JSON.parse(saved) : {};
  }

  loadCardLayouts() {
    const savedLayouts = this.loadSavedLayouts();
    const cards = qsa('.draggable-card');

    cards.forEach(card => {
      const cardId = card.dataset.cardId;
      const layout = savedLayouts[cardId];
      const rect = card.getBoundingClientRect();

      if (layout) {
        if (layout.left) card.style.left = layout.left;
        if (layout.top) card.style.top = layout.top;
        if (layout.width) {
          card.style.width = layout.width;
        } else {
          card.style.width = rect.width + 'px';
        }
        if (layout.height) {
          card.style.height = layout.height;
        } else {
          card.style.height = rect.height + 'px';
        }
        if (layout.left || layout.top) {
          card.style.position = 'absolute';
        }
      } else {
        card.style.width = rect.width + 'px';
        card.style.height = rect.height + 'px';
      }
    });
  }

  resetCardLayouts() {
    if (!confirm('确定要重置所有卡片的位置和大小吗？')) return;

    localStorage.removeItem('cardLayouts');
    
    const cards = qsa('.draggable-card');
    cards.forEach(card => {
      card.style.left = '';
      card.style.top = '';
      card.style.width = '';
      card.style.height = '';
      card.style.position = '';
      card.style.zIndex = '';
    });

    location.reload();
  }
}

class NCESystem {
  constructor() {
    this.state = {
      books: [],
      units: [],
      bookPath: '',
      bookKey: '',
      currentLyrics: [],
      currentLyricIndex: -1,
      currentUnitIndex: -1,
      playMode: 'single',
      singlePlayEndTime: null,
      playbackRate: 1.0,
      translationMode: 'show',
      availableSpeeds: [0.5, 0.75, 1.0, 1.25, 1.5, 2.0],
      savedPlayTime: 0,
      isProgressDragging: false
    };

    this.dom = {
      audioPlayer: qs('#courseAudioPlayer'),
      lyricsDisplay: qs('#courseLyricsDisplay'),
      lyricsContainer: qs('#page-courses .lyrics-container'),
      bookName: qs('#courseBookName'),
      bookLevel: qs('#courseBookLevel'),
      unitList: qs('#courseUnitListContainer'),
      playModeBtn: qs('#coursePlayModeBtn'),
      playPauseBtn: qs('#coursePlayPauseBtn'),
      progressBar: qs('#courseProgressBar'),
      speedBtn: qs('#courseSpeedBtn'),
      speedText: qs('#courseSpeedText'),
      bookCover: qs('#courseBookCover'),
      unitSelect: qs('#courseUnitSelect'),
      bookSelects: [qs('#courseBookSelect')].filter(Boolean),
      prevUnitBtn: qs('#coursePrevUnitBtn'),
      nextUnitBtn: qs('#courseNextUnitBtn'),
      toggleTranslationBtn: qs('#courseToggleTranslationBtn')
    };

    this.lyricLineEls = [];
    this.unitSelectBound = false;
    this.unitListBound = false;
    this.bookSelectsBound = false;
    this.lyricsBound = false;
    this.lrcCache = new Map();
    this.audioPreload = new Map();

    this.init();
  }

  async init() {
    await this.loadBooks();
    await this.applyBookFromHash();
    this.bindEvents();
    this.loadPlayModePreference();
    this.updatePlayModeUI();
    this.loadTranslationPreference();
    this.updateTranslationToggle();
    await this.loadUnitFromStorage();
  }

  async loadBooks() {
    if (this.state.books.length) return this.state.books;
    try {
      const response = await fetch('data.json');
      const data = await response.json();
      this.state.books = Array.isArray(data.books) ? data.books : [];
    } catch (error) {
      console.error('加载课本数据失败:', error);
      this.state.books = [];
    }
    return this.state.books;
  }

  resolveBookByKey(bookKey) {
    if (!this.state.books.length) return null;
    const exact = this.state.books.find((book) => book && book.key === bookKey);
    if (exact && exact.bookPath) return exact;
    const fallback = this.state.books.find((book) => book && book.key === DEFAULT_BOOK_KEY);
    if (fallback && fallback.bookPath) return fallback;
    return this.state.books.find((book) => book && book.bookPath) || null;
  }

  async applyBookFromHash() {
    const keyFromHash = location.hash.slice(1).trim();
    const storedBookKey = this.loadBookPreference();
    const initialBookKey = keyFromHash || storedBookKey || DEFAULT_BOOK_KEY;
    await this.applyBookChange(initialBookKey);
  }

  loadBookPreference() {
    return localStorage.getItem(BOOK_SELECTION_STORAGE_KEY)?.trim() || '';
  }

  persistBookPreference(bookKey) {
    if (!bookKey) return;
    localStorage.setItem(BOOK_SELECTION_STORAGE_KEY, bookKey);
  }

  async applyBookChange(bookKey) {
    await this.loadBooks();
    const resolved = this.resolveBookByKey(bookKey);

    if (!resolved || !resolved.bookPath) {
      this.state.bookPath = '';
      this.state.bookKey = '';
      this.renderEmptyState('未找到可用课本数据');
      return;
    }

    this.state.bookKey = resolved.key || bookKey;
    this.state.bookPath = resolved.bookPath.trim();
    this.persistBookPreference(this.state.bookKey);

    this.updateBookSelects();
    await this.loadBookConfig();
    this.renderUnitList();
    this.renderUnitSelect();
    this.resetUnitListScroll();
  }

  renderEmptyState(message) {
    if (this.dom.lyricsDisplay) {
      this.dom.lyricsDisplay.innerHTML = `<p class="placeholder">${message}</p>`;
    }
    if (this.dom.unitList) {
      this.dom.unitList.innerHTML = '';
    }
    this.resetUnitListScroll();
  }

  resetUnitListScroll() {
    const scrollContainer = this.dom.unitList?.closest('.unit-list');
    if (scrollContainer) {
      scrollContainer.scrollTop = 0;
    }
  }

  async loadBookConfig() {
    if (!this.state.bookPath) {
      this.renderEmptyState('未找到可用课本数据');
      return;
    }

    try {
      const response = await fetch(`${this.state.bookPath}/book.json`);
      const data = await response.json();

      this.state.units = data.units.map((unit, index) => ({
        ...unit,
        id: index + 1,
        title: unit.title,
        audio: `${this.state.bookPath}/${unit.filename}.mp3`,
        lrc: `${this.state.bookPath}/${unit.filename}.lrc`
      }));

      if (this.dom.bookName) {
        this.dom.bookName.textContent = `《${data.bookName}》`;
      }
      if (this.dom.bookLevel) {
        this.dom.bookLevel.textContent = `${data.bookLevel}`;
      }
      if (this.dom.bookCover && data.bookCover) {
        this.dom.bookCover.src = `${this.state.bookPath}/${data.bookCover}`;
      }
      this.lrcCache.clear();
      this.audioPreload.clear();
    } catch (error) {
      console.error('加载课件配置失败:', error);
      this.renderEmptyState(`课件配置加载失败，请检查 ${this.state.bookPath}/book.json 文件`);
    }
  }

  updateBookSelects() {
    if (!this.dom.bookSelects.length || !this.state.books.length) return;

    const options = this.state.books
      .filter((book) => book && book.key && book.title && book.bookPath)
      .map((book) => `<option value="${book.key}">${book.title}</option>`)
      .join('');

    this.dom.bookSelects.forEach((select) => {
      select.innerHTML = `<option value="">选择课本</option>${options}`;
      if (this.state.bookKey) {
        select.value = this.state.bookKey;
      }
    });
  }

  renderUnitList() {
    if (!this.dom.unitList) return;

    this.dom.unitList.innerHTML = this.state.units
      .map(
        (unit, index) => `
      <div class="unit-item" data-unit-index="${index}" tabindex="0" role="button" aria-label="打开 ${unit.title}">
        <h3>${unit.title}</h3>
      </div>
    `
      )
      .join('');
  }

  renderUnitSelect() {
    if (!this.dom.unitSelect) return;

    const options = this.state.units
      .map((unit, index) => `<option value="${index}">${unit.title}</option>`)
      .join('');

    this.dom.unitSelect.innerHTML = `<option value="">选择 Unit</option>${options}`;
  }

  async loadUnitFromStorage() {
    if (!this.state.units.length) return;

    const stored = localStorage.getItem(`${this.state.bookPath}/currentUnitIndex`);
    const parsed = stored ? parseInt(stored) : 0;
    const safeIndex = Number.isFinite(parsed)
      ? clamp(parsed, 0, this.state.units.length - 1)
      : 0;

    await this.loadUnitByIndex(safeIndex, { shouldScrollUnitIntoView: true });
  }

  async loadUnitByIndex(unitIndex, options = {}) {
    const { shouldScrollUnitIntoView = false } = options;

    this.state.currentUnitIndex = unitIndex;
    localStorage.setItem(`${this.state.bookPath}/currentUnitIndex`, unitIndex);

    const unit = this.state.units[unitIndex];
    if (!unit) return;

    this.resetPlayer();
    this.updateActiveUnit(unitIndex, { shouldScrollUnitIntoView });
    this.updateNavigationButtons();

    try {
      let lrcText = this.lrcCache.get(unit.lrc);
      if (!lrcText) {
        const response = await fetch(unit.lrc);
        lrcText = await response.text();
        this.lrcCache.set(unit.lrc, lrcText);
      }
      this.state.currentLyrics = LRCParser.parse(lrcText);
      this.renderLyrics();
    } catch (error) {
      console.error('加载歌词失败:', error);
      if (this.dom.lyricsDisplay) {
        this.dom.lyricsDisplay.innerHTML = '<p class="placeholder">加载失败</p>';
      }
    }

    if (this.dom.audioPlayer) {
      this.setPlayButtonDisabled(true);
      this.dom.audioPlayer.src = unit.audio;
      this.dom.audioPlayer.load();
    }

    this.loadPlayTime();
    this.loadSavedSpeed();
    this.prefetchUnit(unitIndex + 1);
  }

  resetPlayer() {
    if (this.dom.audioPlayer) {
      this.dom.audioPlayer.pause();
      this.dom.audioPlayer.currentTime = 0;
    }

    this.setPlayButtonDisabled(true);

    if (this.dom.progressBar) this.dom.progressBar.style.setProperty('--progress', '0%');

    this.updatePlayButton();
    this.state.currentLyricIndex = -1;
    this.state.singlePlayEndTime = null;
  }

  updateActiveUnit(unitIndex, options = {}) {
    const { shouldScrollUnitIntoView = false } = options;

    if (this.dom.unitList) {
      let activeItem = null;

      this.dom.unitList.querySelectorAll('.unit-item').forEach((item, index) => {
        if (index === unitIndex) {
          item.classList.add('active');
          activeItem = item;
        } else {
          item.classList.remove('active');
        }
      });

      if (activeItem && shouldScrollUnitIntoView) {
        activeItem.scrollIntoView({ block: 'center', inline: 'nearest' });
      }
    }

    if (this.dom.unitSelect) {
      this.dom.unitSelect.value = unitIndex;
    }
  }

  renderLyrics() {
    if (!this.dom.lyricsDisplay) return;

    if (this.dom.lyricsContainer) {
      this.dom.lyricsContainer.scrollTop = 0;
    }

    if (!this.state.currentLyrics.length) {
      this.dom.lyricsDisplay.innerHTML = '<p class="placeholder">没有歌词数据</p>';
      return;
    }

    this.dom.lyricsDisplay.innerHTML = this.state.currentLyrics
      .map(
        (lyric, index) => `
      <div class="lyric-line" data-index="${index}" data-time="${lyric.time}" tabindex="0" role="button" aria-label="播放第 ${index + 1} 句">
        <div class="lyric-text">${lyric.english}</div>
        ${lyric.chinese ? `<div class="lyric-translation">${lyric.chinese}</div>` : ''}
      </div>
    `
      )
      .join('');

    this.lyricLineEls = qsa('.lyric-line', this.dom.lyricsDisplay);
    this.state.currentLyricIndex = -1;
  }

  handleLyricActivate(line) {
    const index = parseInt(line.dataset.index);
    const time = parseFloat(line.dataset.time);
    this.playLyricAtIndex(index, time);
    this.persistPlayTime(time);
  }

  playLyricAtIndex(index, time) {
    if (!this.dom.audioPlayer) return;

    this.dom.audioPlayer.currentTime = time;

    if (this.state.playMode === 'single') {
      const nextLyric = this.state.currentLyrics[index + 1];
      this.state.singlePlayEndTime = nextLyric ? nextLyric.time : this.dom.audioPlayer.duration;
    } else {
      this.state.singlePlayEndTime = null;
    }

    this.dom.audioPlayer.play();
  }

  persistPlayTime(time) {
    localStorage.setItem(`${this.state.bookPath}/${this.state.currentUnitIndex}/playTime`, time);
  }

  checkSinglePlayEnd() {
    if (this.state.playMode !== 'single' || this.state.singlePlayEndTime === null || !this.dom.audioPlayer) {
      return;
    }

    const currentTime = this.dom.audioPlayer.currentTime;
    if (currentTime >= this.state.singlePlayEndTime && this.state.singlePlayEndTime !== this.dom.audioPlayer.duration) {
      this.dom.audioPlayer.pause();
      this.dom.audioPlayer.currentTime = this.state.singlePlayEndTime - 0.01;
      this.state.singlePlayEndTime = null;
    }
  }

  updateProgress() {
    if (!this.dom.progressBar || !this.dom.audioPlayer) return;

    if (this.dom.audioPlayer.duration && !this.state.isProgressDragging) {
      const percent = (this.dom.audioPlayer.currentTime / this.dom.audioPlayer.duration) * 100;
      this.dom.progressBar.style.setProperty('--progress', `${percent}%`);
    }
  }

  updatePlayButton() {
    if (!this.dom.playPauseBtn || !this.dom.audioPlayer) return;

    if (this.dom.audioPlayer.paused) {
      this.dom.playPauseBtn.classList.remove('playing');
    } else {
      this.dom.playPauseBtn.classList.add('playing');
    }
  }

  setPlayButtonDisabled(disabled) {
    if (!this.dom.playPauseBtn) return;
    this.dom.playPauseBtn.disabled = disabled;
    this.dom.playPauseBtn.setAttribute('aria-disabled', disabled ? 'true' : 'false');
  }

  formatTime(seconds) {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  cyclePlaybackSpeed() {
    const currentIndex = this.state.availableSpeeds.indexOf(this.state.playbackRate);
    const nextIndex = (currentIndex + 1) % this.state.availableSpeeds.length;
    this.state.playbackRate = this.state.availableSpeeds[nextIndex];

    if (this.dom.audioPlayer) {
      this.dom.audioPlayer.playbackRate = this.state.playbackRate;
    }

    this.updateSpeedButton();
    localStorage.setItem('playbackRate', this.state.playbackRate);
  }

  updateSpeedButton() {
    if (!this.dom.speedText || !this.dom.speedBtn) return;

    this.dom.speedText.textContent = `${this.state.playbackRate}x`;

    if (this.state.playbackRate !== 1.0) {
      this.dom.speedBtn.classList.add('active');
    } else {
      this.dom.speedBtn.classList.remove('active');
    }
  }

  loadPlayTime() {
    const time = localStorage.getItem(`${this.state.bookPath}/${this.state.currentUnitIndex}/playTime`);
    if (time) {
      const parsed = parseFloat(time);
      if (Number.isFinite(parsed)) {
        this.state.savedPlayTime = parsed;
      }
    }
  }

  loadSavedSpeed() {
    const savedSpeed = localStorage.getItem('playbackRate');
    if (savedSpeed) {
      const parsed = parseFloat(savedSpeed);
      if (!Number.isFinite(parsed)) return;
      this.state.playbackRate = parsed;
      if (this.dom.audioPlayer) {
        this.dom.audioPlayer.playbackRate = this.state.playbackRate;
      }
      this.updateSpeedButton();
    }
  }

  updateNavigationButtons() {
    if (this.dom.prevUnitBtn) {
      this.dom.prevUnitBtn.disabled = this.state.currentUnitIndex <= 0;
    }

    if (this.dom.nextUnitBtn) {
      this.dom.nextUnitBtn.disabled = this.state.currentUnitIndex >= this.state.units.length - 1;
    }
  }

  loadPreviousUnit() {
    if (this.state.currentUnitIndex > 0) {
      this.loadUnitByIndex(this.state.currentUnitIndex - 1);
    }
  }

  loadNextUnit() {
    if (this.state.currentUnitIndex < this.state.units.length - 1) {
      this.loadUnitByIndex(this.state.currentUnitIndex + 1);
    }
  }

  togglePlayMode() {
    this.state.playMode = this.state.playMode === 'single' ? 'continuous' : 'single';
    localStorage.setItem(PLAY_MODE_STORAGE_KEY, this.state.playMode);
    this.updatePlayModeUI();
  }

  updatePlayModeUI() {
    if (!this.dom.playModeBtn) return;

    if (this.state.playMode === 'single') {
      this.dom.playModeBtn.title = '单句点读';
      this.dom.playModeBtn.setAttribute('aria-label', '单句点读');
      this.dom.playModeBtn.setAttribute('aria-pressed', 'false');
      this.dom.playModeBtn.dataset.mode = 'single';
      this.dom.playModeBtn.classList.remove('continuous-mode');
    } else {
      this.dom.playModeBtn.title = '连续点读';
      this.dom.playModeBtn.setAttribute('aria-label', '连续点读');
      this.dom.playModeBtn.setAttribute('aria-pressed', 'true');
      this.dom.playModeBtn.dataset.mode = 'continuous';
      this.dom.playModeBtn.classList.add('continuous-mode');
    }
  }

  loadPlayModePreference() {
    const storedMode = localStorage.getItem(PLAY_MODE_STORAGE_KEY);
    if (storedMode === 'single' || storedMode === 'continuous') {
      this.state.playMode = storedMode;
    }
  }

  handleAudioEnded() {
    if (this.state.playMode === 'continuous') {
      this.playNextLyric();
    }
  }

  playNextLyric() {
    const nextIndex = this.state.currentLyricIndex + 1;
    if (nextIndex < this.state.currentLyrics.length && this.dom.audioPlayer) {
      const nextLyric = this.state.currentLyrics[nextIndex];
      this.dom.audioPlayer.currentTime = nextLyric.time;
      this.dom.audioPlayer.play();
    }
  }

  updateLyricHighlight() {
    if (!this.lyricLineEls.length || !this.dom.audioPlayer) return;

    const currentTime = this.dom.audioPlayer.currentTime;
    let newIndex = -1;
    for (let i = this.state.currentLyrics.length - 1; i >= 0; i--) {
      if (currentTime >= this.state.currentLyrics[i].time) {
        newIndex = i;
        break;
      }
    }

    if (newIndex === this.state.currentLyricIndex) return;

    if (this.state.currentLyricIndex >= 0 && this.lyricLineEls[this.state.currentLyricIndex]) {
      this.lyricLineEls[this.state.currentLyricIndex].classList.remove('active');
      this.lyricLineEls[this.state.currentLyricIndex].classList.remove('pulse');
    }

    this.state.currentLyricIndex = newIndex;

    if (newIndex >= 0) {
      const activeLine = this.lyricLineEls[newIndex];
      if (activeLine) {
        activeLine.classList.add('active');
        activeLine.classList.add('pulse');
        if (this.shouldScrollLyricIntoView(activeLine)) {
          activeLine.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
    }
  }

  prefetchUnit(unitIndex) {
    const unit = this.state.units[unitIndex];
    if (!unit) return;

    if (unit.lrc && !this.lrcCache.has(unit.lrc)) {
      fetch(unit.lrc)
        .then((response) => response.text())
        .then((text) => this.lrcCache.set(unit.lrc, text))
        .catch(() => {});
    }

    if (unit.audio && !this.audioPreload.has(unit.audio)) {
      const audio = new Audio();
      audio.preload = 'auto';
      audio.src = unit.audio;
      this.audioPreload.set(unit.audio, audio);
    }
  }

  shouldScrollLyricIntoView(activeLine) {
    if (!this.dom.lyricsContainer) return true;
    const containerRect = this.dom.lyricsContainer.getBoundingClientRect();
    const lineRect = activeLine.getBoundingClientRect();
    const topThreshold = containerRect.top + containerRect.height * 0.22;
    const bottomThreshold = containerRect.bottom - containerRect.height * 0.22;
    return lineRect.top < topThreshold || lineRect.bottom > bottomThreshold;
  }

  bindEvents() {
    this.bindBookSelects();
    this.bindUnitList();
    this.bindUnitSelect();
    this.bindLyrics();
    this.bindPlayerControls();
    this.bindNavigation();
    this.bindTranslationToggle();
  }

  bindTranslationToggle() {
    if (!this.dom.toggleTranslationBtn) return;
    this.dom.toggleTranslationBtn.addEventListener('click', () => {
      const modes = ['show', 'hide', 'blur'];
      const currentIndex = modes.indexOf(this.state.translationMode);
      const nextIndex = currentIndex === -1 ? 0 : (currentIndex + 1) % modes.length;
      this.state.translationMode = modes[nextIndex];
      localStorage.setItem('translationMode', this.state.translationMode);
      this.updateTranslationToggle();
    });
  }

  loadTranslationPreference() {
    const storedMode = localStorage.getItem('translationMode');
    if (storedMode === 'show' || storedMode === 'hide' || storedMode === 'blur') {
      this.state.translationMode = storedMode;
    }
  }

  updateTranslationToggle() {
    if (!this.dom.toggleTranslationBtn) return;
    const mode = this.state.translationMode;
    document.body.classList.toggle('hide-translation', mode === 'hide');
    document.body.classList.toggle('blur-translation', mode === 'blur');

    if (mode === 'show') {
      this.dom.toggleTranslationBtn.textContent = '中';
      this.dom.toggleTranslationBtn.setAttribute('aria-pressed', 'true');
      this.dom.toggleTranslationBtn.setAttribute('aria-label', '翻译显示');
    } else if (mode === 'blur') {
      this.dom.toggleTranslationBtn.textContent = '模';
      this.dom.toggleTranslationBtn.setAttribute('aria-pressed', 'mixed');
      this.dom.toggleTranslationBtn.setAttribute('aria-label', '翻译模糊显示');
    } else {
      this.dom.toggleTranslationBtn.textContent = '英';
      this.dom.toggleTranslationBtn.setAttribute('aria-pressed', 'false');
      this.dom.toggleTranslationBtn.setAttribute('aria-label', '仅显示英文');
    }
  }

  bindBookSelects() {
    if (this.bookSelectsBound || !this.dom.bookSelects.length) return;
    this.bookSelectsBound = true;

    this.dom.bookSelects.forEach((select) => {
      select.addEventListener('change', (event) => {
        const target = event.target;
        if (!target.value) return;
        this.applyBookChange(target.value).then(() => this.loadUnitFromStorage());
      });
    });
  }

  bindUnitList() {
    if (this.unitListBound || !this.dom.unitList) return;
    this.unitListBound = true;

    this.dom.unitList.addEventListener('click', (event) => {
      const item = event.target.closest('.unit-item');
      if (!item) return;
      const unitIndex = parseInt(item.dataset.unitIndex);
      this.loadUnitByIndex(unitIndex);
    });

    this.dom.unitList.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      const item = event.target.closest('.unit-item');
      if (!item) return;
      event.preventDefault();
      const unitIndex = parseInt(item.dataset.unitIndex);
      this.loadUnitByIndex(unitIndex);
    });
  }

  bindUnitSelect() {
    if (this.unitSelectBound || !this.dom.unitSelect) return;
    this.unitSelectBound = true;

    this.dom.unitSelect.addEventListener('change', (event) => {
      const unitIndex = parseInt(event.target.value);
      if (unitIndex >= 0) {
        this.loadUnitByIndex(unitIndex);
      }
    });
  }

  bindLyrics() {
    if (this.lyricsBound || !this.dom.lyricsDisplay) return;
    this.lyricsBound = true;

    this.dom.lyricsDisplay.addEventListener('click', (event) => {
      const line = event.target.closest('.lyric-line');
      if (!line) return;
      this.handleLyricActivate(line);
    });

    this.dom.lyricsDisplay.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      const line = event.target.closest('.lyric-line');
      if (!line) return;
      event.preventDefault();
      this.handleLyricActivate(line);
    });
  }

  bindPlayerControls() {
    if (
      !this.dom.playPauseBtn ||
      !this.dom.speedBtn ||
      !this.dom.progressBar ||
      !this.dom.audioPlayer ||
      !this.dom.playModeBtn
    ) {
      return;
    }

    this.dom.playPauseBtn.addEventListener('click', () => {
      if (this.dom.audioPlayer.paused) {
        this.dom.audioPlayer.play();
      } else {
        this.dom.audioPlayer.pause();
      }
    });

    this.dom.speedBtn.addEventListener('click', () => {
      this.cyclePlaybackSpeed();
    });

    const seekByClientX = (clientX) => {
      if (!this.dom.audioPlayer.duration) return;
      const rect = this.dom.progressBar.getBoundingClientRect();
      const percent = clamp((clientX - rect.left) / rect.width, 0, 1);
      this.dom.audioPlayer.currentTime = percent * this.dom.audioPlayer.duration;
    };

    this.dom.progressBar.addEventListener('click', (event) => {
      seekByClientX(event.clientX);
    });

    this.dom.progressBar.addEventListener('pointerdown', (event) => {
      this.state.isProgressDragging = true;
      this.dom.progressBar.classList.add('dragging');
      this.dom.progressBar.setPointerCapture(event.pointerId);
      seekByClientX(event.clientX);
    });

    this.dom.progressBar.addEventListener('pointermove', (event) => {
      if (!this.state.isProgressDragging) return;
      seekByClientX(event.clientX);
    });

    this.dom.progressBar.addEventListener('pointerup', (event) => {
      this.state.isProgressDragging = false;
      this.dom.progressBar.classList.remove('dragging');
      this.dom.progressBar.releasePointerCapture(event.pointerId);
    });

    this.dom.progressBar.addEventListener('pointercancel', () => {
      this.state.isProgressDragging = false;
      this.dom.progressBar.classList.remove('dragging');
    });

    this.dom.progressBar.addEventListener('pointerleave', () => {
      this.state.isProgressDragging = false;
      this.dom.progressBar.classList.remove('dragging');
    });

    this.dom.playModeBtn.addEventListener('click', () => {
      this.togglePlayMode();
    });

    this.dom.audioPlayer.addEventListener('timeupdate', () => {
      this.checkSinglePlayEnd();
      this.updateLyricHighlight();
      this.updateProgress();
    });

    this.dom.audioPlayer.addEventListener('loadedmetadata', () => {
    });

    this.dom.audioPlayer.addEventListener('canplay', () => {
      this.setPlayButtonDisabled(false);
    });

    this.dom.audioPlayer.addEventListener('loadstart', () => {
      this.setPlayButtonDisabled(true);
    });

    this.dom.audioPlayer.addEventListener('ended', () => {
      this.handleAudioEnded();
      this.updatePlayButton();
    });

    this.dom.audioPlayer.addEventListener('play', () => {
      this.updatePlayButton();
    });

    this.dom.audioPlayer.addEventListener('pause', () => {
      this.state.singlePlayEndTime = null;
      this.updatePlayButton();
    });

    this.dom.audioPlayer.addEventListener('error', () => {
      this.setPlayButtonDisabled(true);
    });
  }

  bindNavigation() {
    if (this.dom.prevUnitBtn) {
      this.dom.prevUnitBtn.addEventListener('click', () => {
        this.loadPreviousUnit();
      });
    }

    if (this.dom.nextUnitBtn) {
      this.dom.nextUnitBtn.addEventListener('click', () => {
        this.loadNextUnit();
      });
    }
  }
}

class WordMemoryManager {
  constructor() {
    this.storageKey = 'wordMemory';
    this.maxFuzzyReviews = 4;
    this.wordStatus = this.loadWordStatus();
    this.studySessionKey = 'currentStudySession';
  }

  loadWordStatus() {
    const saved = localStorage.getItem(this.storageKey);
    return saved ? JSON.parse(saved) : {};
  }

  saveWordStatus() {
    localStorage.setItem(this.storageKey, JSON.stringify(this.wordStatus));
  }

  getWordStatus(word) {
    return this.wordStatus[word] || {
      status: 'new',
      reviews: 0,
      fuzzyReviews: 0,
      nextReview: Date.now(),
      history: []
    };
  }

  updateWordStatus(word, status) {
    const now = Date.now();
    const current = this.getWordStatus(word);
    
    let newStatus = { ...current };
    newStatus.history.push({ status, timestamp: now });
    
    if (status === 'remember') {
      newStatus.status = 'mastered';
      newStatus.nextReview = null;
    } else if (status === 'fuzzy') {
      newStatus.status = 'fuzzy';
      newStatus.fuzzyReviews++;
      newStatus.reviews++;
      if (newStatus.fuzzyReviews >= this.maxFuzzyReviews) {
        newStatus.status = 'mastered';
        newStatus.nextReview = null;
      } else {
        newStatus.nextReview = now;
      }
    } else if (status === 'forget') {
      newStatus.status = 'forgotten';
      newStatus.fuzzyReviews = 0;
      newStatus.reviews = 0;
      newStatus.nextReview = now;
    }
    
    this.wordStatus[word] = newStatus;
    this.saveWordStatus();
    return newStatus;
  }

  getWordsToReview(words) {
    const now = Date.now();
    return words.filter(word => {
      const status = this.getWordStatus(word.word);
      if (status.status === 'mastered') return false;
      if (!status.nextReview) return true;
      return status.nextReview <= now;
    });
  }

  getStats() {
    const all = Object.values(this.wordStatus);
    const mastered = all.filter(s => s.status === 'mastered').length;
    const toReview = all.filter(s => s.status !== 'mastered' && (!s.nextReview || s.nextReview <= Date.now())).length;
    return {
      total: all.length,
      mastered,
      toReview
    };
  }

  getMemoryCurve() {
    const curve = [100, 58, 44, 36, 33, 28, 25];
    return curve;
  }

  getDailyStats() {
    const today = new Date().toDateString();
    const dailyKey = 'dailyWordStats';
    const saved = localStorage.getItem(dailyKey);
    const dailyStats = saved ? JSON.parse(saved) : {};
    
    if (!dailyStats[today]) {
      dailyStats[today] = {
        studied: 0,
        remembered: 0,
        fuzzy: 0,
        forgotten: 0
      };
    }
    
    return dailyStats;
  }
}

class WordStudyManager {
  constructor(app, nceData) {
    this.app = app;
    this.nceData = nceData;
    this.memoryManager = new WordMemoryManager();
    this.selectedBooks = ['NCE1'];
    this.currentWordIndex = 0;
    this.currentWordList = [];
    this.isStudying = false;
    this.forgottenWordsQueue = [];
    this.books = [];
    
    this.init();
  }

  async init() {
    await this.loadBooks();
    this.updateBookSelect();
    this.bindBookSelection();
    this.bindStartButton();
    this.bindWordActions();
    this.updateStats();
  }

  async loadBooks() {
    try {
      const response = await fetch('data.json');
      const data = await response.json();
      this.books = Array.isArray(data.books) ? data.books : [];
    } catch (error) {
      console.error('加载课本数据失败:', error);
      this.books = [];
    }
    return this.books;
  }

  updateBookSelect() {
    const select = qs('#wordBookSelect');
    if (!select || !this.books.length) return;

    const options = this.books
      .filter((book) => book && book.key && book.title)
      .map((book) => `<option value="${book.key}">${book.title}</option>`)
      .join('');

    select.innerHTML = `<option value="">选择课本</option>${options}`;
    
    const saved = this.loadSelectedBooks();
    if (saved) {
      select.value = saved[0] || '';
    }
  }

  bindBookSelection() {
    const select = qs('#wordBookSelect');
    if (select) {
      select.addEventListener('change', () => {
        const value = select.value;
        if (value) {
          this.selectedBooks = [value];
          this.saveSelectedBooks();
        }
      });
    }
  }

  loadSelectedBooks() {
    const saved = localStorage.getItem('selectedWordBooks');
    if (saved) {
      this.selectedBooks = JSON.parse(saved);
      return this.selectedBooks;
    }
    return null;
  }

  saveSelectedBooks() {
    localStorage.setItem('selectedWordBooks', JSON.stringify(this.selectedBooks));
  }

  bindStartButton() {
    const startBtn = qs('#startWordStudy');
    if (startBtn) {
      startBtn.addEventListener('click', () => this.startStudy());
    }
  }

  startStudy() {
    if (this.selectedBooks.length === 0) {
      alert('请至少选择一册教材！');
      return;
    }

    const allWords = this.nceData.getWords(this.selectedBooks);
    this.currentWordList = this.memoryManager.getWordsToReview(allWords);
    
    if (this.currentWordList.length === 0) {
      this.currentWordList = allWords;
    }
    
    this.forgottenWordsQueue = [];
    this.shuffleWordList();
    this.currentWordIndex = 0;
    this.isStudying = true;
    
    qs('#memoryCurveSection').style.display = 'block';
    qs('#flashcard').style.display = 'block';
    qs('#noWordsMessage').style.display = 'none';
    
    this.showWord();
    this.updateMemoryCurve();
  }

  shuffleWordList() {
    for (let i = this.currentWordList.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.currentWordList[i], this.currentWordList[j]] = 
        [this.currentWordList[j], this.currentWordList[i]];
    }
  }

  showWord() {
    let word = null;
    
    if (this.forgottenWordsQueue.length > 0) {
      word = this.forgottenWordsQueue.shift();
    } else if (this.currentWordIndex < this.currentWordList.length) {
      word = this.currentWordList[this.currentWordIndex];
      this.currentWordIndex++;
    } else {
      this.endStudy();
      return;
    }

    const flashcard = qs('#flashcard');
    const cardFront = flashcard.querySelector('.card-front');
    const cardBack = flashcard.querySelector('.card-back');
    
    cardFront.style.display = 'flex';
    cardBack.style.display = 'none';
    
    qs('#flashcardWord').textContent = word.word;
    qs('#flashcardPhonetic').textContent = word.phonetic;
    qs('#flashcardWordBack').textContent = word.word;
    qs('#flashcardMeaning').textContent = word.meaning;
    
    this.currentWord = word;
    this.showExamples(word);
  }

  showExamples(word) {
    const examplesList = qs('#examplesList');
    if (examplesList && word.examples) {
      examplesList.innerHTML = word.examples.map(ex => 
        `<div class="example-item">${ex}</div>`
      ).join('');
    }
  }

  bindWordActions() {
    const showMeaningBtn = qs('#showMeaning');
    if (showMeaningBtn) {
      showMeaningBtn.addEventListener('click', () => {
        const flashcard = qs('#flashcard');
        const cardFront = flashcard.querySelector('.card-front');
        const cardBack = flashcard.querySelector('.card-back');
        cardFront.style.display = 'none';
        cardBack.style.display = 'flex';
      });
    }

    const rememberBtn = qs('#rememberBtn');
    const fuzzyBtn = qs('#fuzzyBtn');
    const forgetBtn = qs('#forgetBtn');

    if (rememberBtn) rememberBtn.addEventListener('click', () => this.handleWordAction('remember'));
    if (fuzzyBtn) fuzzyBtn.addEventListener('click', () => this.handleWordAction('fuzzy'));
    if (forgetBtn) forgetBtn.addEventListener('click', () => this.handleWordAction('forget'));
  }

  handleWordAction(action) {
    const word = this.currentWord;
    this.memoryManager.updateWordStatus(word.word, action);
    this.memoryManager.updateDailyStats(action);
    
    let result = '';
    if (action === 'remember') {
      result = 'remembered';
    } else if (action === 'fuzzy') {
      result = 'fuzzy';
    } else if (action === 'forget') {
      result = 'forgot';
    }
    
    if (this.app && this.app.recordWordProgress) {
      this.app.recordWordProgress(result);
    }
    
    if (action === 'forget') {
      this.forgottenWordsQueue.push(word);
    } else if (action === 'fuzzy') {
      const status = this.memoryManager.getWordStatus(word.word);
      if (status.fuzzyReviews < this.memoryManager.maxFuzzyReviews) {
        const randomIndex = Math.floor(Math.random() * (this.forgottenWordsQueue.length + 1));
        this.forgottenWordsQueue.splice(randomIndex, 0, word);
      }
    }
    
    this.updateStats();
    this.showWord();
  }

  endStudy() {
    this.isStudying = false;
    alert('学习完成！继续加油！');
    qs('#flashcard').style.display = 'none';
    qs('#noWordsMessage').style.display = 'flex';
  }

  updateStats() {
    const stats = this.memoryManager.getStats();
    const totalEl = qs('#totalWordsStudied');
    const reviewEl = qs('#wordsToReview');
    const masteredEl = qs('#wordsMastered');
    
    if (totalEl) totalEl.textContent = stats.total;
    if (reviewEl) reviewEl.textContent = stats.toReview;
    if (masteredEl) masteredEl.textContent = stats.mastered;
  }

  updateMemoryCurve() {
    const curve = this.memoryManager.getMemoryCurve();
    const pointsContainer = qs('#curvePoints');
    if (pointsContainer) {
      pointsContainer.innerHTML = curve.map((value, index) => {
        const x = (index / (curve.length - 1)) * 100;
        const y = 100 - value;
        return `<div class="curve-point" style="left: ${x}%; bottom: ${y}%;" data-value="${value}"></div>`;
      }).join('');
    }
  }
}

class LRCParser {
  static parse(lrcText) {
    const lines = lrcText.split('\n');
    const lyrics = [];

    for (const line of lines) {
      const match = line.match(/\[(\d{2}):(\d{2})\.(\d{2,3})\](.+)/);
      if (match) {
        const minutes = parseInt(match[1]);
        const seconds = parseInt(match[2]);
        const milliseconds = parseInt(match[3]);
        const time = minutes * 60 + seconds + milliseconds / 1000 - 0.5;

        const text = match[4].trim();
        const parts = text.split('|').map((p) => p.trim());

        lyrics.push({
          time,
          english: parts[0] || '',
          chinese: parts[1] || '',
          fullText: text
        });
      }
    }

    return lyrics.sort((a, b) => a.time - b.time);
  }
}

let appInstance;

document.addEventListener('DOMContentLoaded', () => {
  appInstance = new EnglishLearningApp();
});
