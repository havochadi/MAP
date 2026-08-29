import type { LevelCurriculum } from "./types";

// Mathematics, P1-P6 and Sec1-Sec4. Sec3-4 covers the compulsory Elementary
// Mathematics (E-Math) track — Additional Mathematics (A-Math) is a separate
// optional subject only some students take, out of scope for a general MAP
// tuition guide. Reflects the 2026 PSLE syllabus revision (Speed removed
// from primary entirely and now introduced at Sec1; Ratio and Average moved
// from P5 to P6; Algebra newly introduced at P6; Pie Charts and Nets of
// Solids moved to P4).
export const mathCurriculum: LevelCurriculum[] = [
  {
    level: "P1",
    topics: [
      {
        title: "Whole Numbers to 100",
        strand: "Number and Algebra",
        description:
          "Counting, reading, writing and comparing numbers to 100, with place value in tens and ones. Use concrete base-ten blocks before moving to number lines and symbols — this Concrete-Pictorial-Abstract sequencing is the backbone of MOE's primary math pedagogy.",
        conceptExplanation:
          "Place value means the position of a digit determines its value: in a two-digit number like 47, the '4' is worth 4 tens (40) and the '7' is worth 7 ones (7), even though both are single digits. This is why 47 and 74 are different numbers even though they use the same digits — swapping the positions changes what each digit is worth. Counting to 100 builds on grouping in tens: instead of counting one by one past 20, it's faster to count in groups of ten and then add on the leftover ones. Comparing two numbers starts by comparing the tens digit first, and only looking at the ones digit if the tens are equal.",
        workedExamples: [
          {
            problem: "Which is bigger: 38 or 83? Explain using place value.",
            solution: [
              "In 38, the tens digit is 3, so it is worth 30.",
              "In 83, the tens digit is 8, so it is worth 80.",
              "80 is bigger than 30, so 83 is bigger than 38, even though both numbers use the digits 3 and 8.",
            ],
          },
          {
            problem: "Write 56 in expanded form (tens and ones).",
            solution: ["56 has a 5 in the tens place and a 6 in the ones place.", "5 tens = 50", "6 ones = 6", "56 = 50 + 6"],
          },
        ],
        teachingSteps: [
          "Concrete: give students base-ten blocks and have them physically build a two-digit number, bundling ten ones into a ten-rod.",
          "Concrete: have students compare two built numbers side by side, deciding which is bigger by looking at the tens first.",
          "Pictorial: move to drawing the blocks as simple tens-and-ones sketches for a number instead of using physical blocks.",
          "Abstract: introduce writing the number in digits and expanded form (e.g. 47 = 40 + 7), linking each digit back to the blocks.",
          "Guided practice: work through 3-4 compare-and-order questions together using the abstract digits only.",
          "Independent practice: have students order a set of numbers to 100 and explain their reasoning using place value.",
          "Check understanding: give one number written with digits reversed (e.g. confusing 61 and 16) and ask students to build it with blocks to catch the error.",
        ],
      },
      {
        title: "Addition and Subtraction within 100",
        strand: "Number and Algebra",
        description:
          "Adding and subtracting two numbers within 100, including simple word problems. Watch for students who count on their fingers instead of using number bonds — model number bonds to 10 and 20 explicitly before extending to larger numbers.",
        conceptExplanation:
          "Adding two numbers within 100 means combining the ones together and the tens together separately, then joining the results — this is why lining numbers up by place value (ones under ones, tens under tens) matters. When the ones add up to 10 or more, we 'regroup' — trade 10 ones for 1 ten and carry it into the tens column. Subtraction works the same way in reverse: if there aren't enough ones to subtract from, we 'borrow' a ten and trade it for 10 extra ones. Number bonds (knowing pairs of numbers that make 10, like 6+4 or 7+3) make both of these much faster than counting on fingers.",
        workedExamples: [
          {
            problem: "23 + 15 = ?",
            solution: [
              "Line up by place value: 23 has 2 tens 3 ones, 15 has 1 ten 5 ones.",
              "Add the ones: 3 + 5 = 8",
              "Add the tens: 2 + 1 = 3",
              "23 + 15 = 38",
            ],
          },
          {
            problem: "42 - 17 = ?",
            solution: [
              "42 has 4 tens 2 ones. We need to subtract 7 ones, but there are only 2 ones.",
              "Borrow 1 ten from the 4 tens, trading it for 10 ones: now we have 3 tens and 12 ones.",
              "Subtract the ones: 12 - 7 = 5",
              "Subtract the tens: 3 - 1 = 2",
              "42 - 17 = 25",
            ],
          },
        ],
        teachingSteps: [
          "Concrete: review number bonds to 10 using counters, physically splitting a group of 10 into two parts.",
          "Concrete: extend to number bonds to 20 the same way, before touching any two-digit addition.",
          "Pictorial: draw a simple bar model or bond diagram for a two-digit addition problem, showing the whole split into parts.",
          "Abstract: model the standard written addition method, explicitly connecting each regrouping step back to the bond diagram.",
          "Guided practice: solve 3-4 addition and subtraction problems together, alternating who leads each step.",
          "Independent practice: have students solve a simple one-step word problem, drawing their own bar model first.",
          "Check understanding: watch specifically for finger-counting instead of number bonds, and redirect back to the bond diagram when it appears.",
        ],
      },
      {
        title: "Multiplication and Division (Introductory)",
        strand: "Number and Algebra",
        description:
          "First exposure to multiplication as repeated addition and division as equal sharing, using pictures and objects rather than the × and ÷ symbols yet. Keep it concrete — this lays the groundwork for the times tables introduced properly in P2.",
        conceptExplanation:
          "Multiplication at this stage means putting together equal groups and finding the total — for example, 3 groups of 4 objects means 4 + 4 + 4, which is 3 lots of 4. Division is the opposite idea: sharing a total equally into a given number of groups, or asking how many equal groups can be made. At this introductory stage, students work these out by drawing or counting pictures rather than using the × and ÷ symbols, since the goal is understanding 'groups of' and 'sharing equally' before the shorthand notation is introduced. This groundwork is essential because P2's times tables only make sense once 'groups of' is truly understood, not just memorised.",
        workedExamples: [
          {
            problem: "There are 3 plates, each with 4 apples. How many apples in total?",
            solution: [
              "Draw 3 groups (plates) with 4 apples (dots) in each.",
              "Count the total by adding each group: 4 + 4 + 4",
              "4 + 4 = 8, then 8 + 4 = 12",
              "There are 12 apples in total.",
            ],
          },
          {
            problem: "There are 12 sweets shared equally among 3 children. How many sweets does each child get?",
            solution: [
              "Draw 12 sweets (dots), then share them one at a time into 3 groups (one for each child).",
              "Give one sweet to each child, then repeat until all 12 are given out.",
              "Each group ends up with 4 sweets.",
              "Each child gets 4 sweets.",
            ],
          },
        ],
        teachingSteps: [
          "Concrete: arrange objects into equal groups (e.g. 3 groups of 4 counters) and have students count the total by adding each group.",
          "Concrete: reverse it — give a pile of objects and have students physically share it equally among a few plates.",
          "Pictorial: draw the equal groups as simple circles-and-dots pictures instead of using real objects.",
          "Discuss: explicitly connect the repeated addition (4+4+4) to the idea of multiplication as 'groups of' without introducing the × symbol yet.",
          "Guided practice: work through 2-3 more grouping and sharing scenarios together using drawings.",
          "Independent practice: have students draw their own picture to solve a simple 'equal groups' or 'equal sharing' story.",
          "Check understanding: ask a student to explain in their own words the difference between the grouping (multiplication) and sharing (division) pictures they drew.",
        ],
      },
      {
        title: "2D Shapes",
        strand: "Measurement and Geometry",
        description:
          "Identifying and describing rectangles, squares, circles and triangles by their properties (sides, corners), not just by appearance. Have students sort a mixed pile of physical shapes rather than only pointing at pictures in a worksheet.",
        conceptExplanation:
          "2D shapes are flat shapes that can be identified by their properties — the number of straight sides they have and the number of corners (also called vertices) where two sides meet — rather than just how they look. A triangle always has 3 sides and 3 corners, a rectangle always has 4 sides and 4 corners with opposite sides equal, and a square is a special rectangle where all 4 sides are equal. A circle is different from the others because it has no straight sides and no corners at all — it's one continuous curved line. Learning to sort shapes by these properties (not just by size or which way they're pointing) is what lets students correctly identify a shape even when it looks unfamiliar, like a very thin triangle or a tilted square.",
        workedExamples: [
          {
            problem: "How many sides and corners does a rectangle have?",
            solution: ["A rectangle has 4 straight sides.", "It has 4 corners, one where each pair of sides meets.", "A rectangle has 4 sides and 4 corners."],
          },
          {
            problem: "A shape has 3 straight sides and 3 corners. What shape is it?",
            solution: ["Count the sides: 3 straight sides.", "Count the corners: 3 corners, matching the 3 sides.", "A shape with exactly 3 sides and 3 corners is a triangle."],
          },
        ],
        teachingSteps: [
          "Concrete: give students a mixed pile of physical shape cut-outs to sort freely first, without naming any rule.",
          "Discuss: ask students what rule they used to sort, then introduce the correct names (rectangle, square, circle, triangle).",
          "Concrete: have students trace fingers around the sides and corners of each shape, counting aloud as they go.",
          "Pictorial: match each physical shape to its drawn outline on a worksheet.",
          "Guided practice: sort a second mixed pile together, this time explicitly naming the property (number of sides/corners) for each shape.",
          "Independent practice: have students find and name 3-4 real classroom objects that match each shape.",
          "Check understanding: show an irregular quadrilateral and ask if it's a rectangle — use it to test whether students are using properties, not just appearance.",
        ],
      },
      {
        title: "Length",
        strand: "Measurement and Geometry",
        description:
          "Comparing and ordering lengths directly (side by side) and indirectly using non-standard units (paperclips, hand spans) before introducing the centimetre. A common error is comparing objects that aren't aligned at the same starting point.",
        conceptExplanation:
          "Comparing length means figuring out which of two objects is longer or shorter. Direct comparison works when you can place two objects side by side, lined up at the same starting point — the one that extends further is longer. When objects can't be placed side by side, we use indirect comparison: measuring each object with the same non-standard unit (like paperclips or hand spans) and comparing the counts. It's important that the SAME unit is used for both objects being compared — 5 paperclips and 5 hand spans are not the same length, since a hand span is much longer than a paperclip.",
        workedExamples: [
          {
            problem: "A pencil is measured as 8 paperclips long. An eraser is measured as 3 paperclips long. Which is longer, and by how many paperclips?",
            solution: [
              "The pencil is 8 paperclips long.",
              "The eraser is 3 paperclips long.",
              "8 is greater than 3, so the pencil is longer.",
              "8 - 3 = 5, so the pencil is longer by 5 paperclips.",
            ],
          },
          {
            problem: "Why can't you fairly compare a book measured in hand spans with a table measured in paperclips?",
            solution: [
              "A hand span and a paperclip are different lengths — a hand span is much longer than a paperclip.",
              "If the book is measured in the longer unit (hand spans) and the table in the shorter unit (paperclips), the counts can't be compared directly.",
              "To compare fairly, both objects must be measured using the exact same unit.",
            ],
          },
        ],
        teachingSteps: [
          "Concrete: line up two objects side by side at the same starting edge and ask which is longer, emphasising the aligned starting point.",
          "Concrete: measure a classroom object using non-standard units (paperclips end to end) and count the total.",
          "Discuss: measure the same object using a different-sized non-standard unit (hand spans) and ask why the count changed.",
          "Pictorial: draw two objects of different lengths on paper, marking the aligned starting point before comparing.",
          "Guided practice: order 3-4 objects from shortest to longest using non-standard units together.",
          "Independent practice: have students measure and order their own set of 3 classroom objects using paperclips.",
          "Check understanding: present two misaligned objects and ask a student to spot why comparing them directly would be unfair.",
        ],
      },
      {
        title: "Time and Money",
        strand: "Measurement and Geometry",
        description:
          "Telling time to the hour and half-hour on an analogue clock, and recognising and counting Singapore coins and notes. Bring real coins if possible — abstract worksheets alone don't build the same number sense.",
        conceptExplanation:
          "An analogue clock has two hands: the short hour hand and the long minute hand. When the minute hand points straight up at the 12, the time is exactly 'o'clock,' and the hour hand tells you which hour it is. When the minute hand points straight down at the 6, exactly 30 minutes (half an hour) has passed, so the time is 'half past' — and the hour hand will be sitting between two numbers, closer to the next hour. For money, Singapore's coins (5c, 10c, 20c, 50c, $1) and notes each have a fixed value, and counting a total means adding up the values of all the coins and notes together, usually starting with the largest value first to make the counting easier.",
        workedExamples: [
          {
            problem: "The minute hand points at 12 and the hour hand points at 3. What time is it?",
            solution: [
              "The minute hand at 12 means it is exactly 'o'clock' — 0 minutes have passed.",
              "The hour hand points at 3, showing which hour it is.",
              "The time is 3 o'clock.",
            ],
          },
          {
            problem: "You have one 50c coin, one 20c coin, and two 10c coins. How much money do you have in total?",
            solution: [
              "Start with the largest value: 50c",
              "Add the 20c coin: 50c + 20c = 70c",
              "Add the first 10c coin: 70c + 10c = 80c",
              "Add the second 10c coin: 80c + 10c = 90c",
              "The total is 90c.",
            ],
          },
        ],
        teachingSteps: [
          "Concrete: use a real or model analogue clock, moving the hour hand to a whole hour and asking students to read it.",
          "Concrete: move the minute hand to the half-hour position, explicitly showing where the hour hand sits in between.",
          "Guided practice: set 3-4 more o'clock and half-hour times together, alternating who moves the hands.",
          "Concrete: lay out real (or realistic play) Singapore coins and notes, having students identify and name each one.",
          "Guided practice: count out a small total using a mix of coins, modelling counting from the largest value down.",
          "Independent practice: have students read 3 clock times and count out one coin total on their own.",
          "Check understanding: show a clock reading 'half past' and ask a student to explain where exactly both hands are and why.",
        ],
      },
      {
        title: "Picture Graphs",
        strand: "Statistics",
        description:
          "Reading and interpreting simple picture graphs where one picture represents one unit. This is the entry point to the data-handling strand that grows into bar graphs (P3) and pie charts (P6).",
        conceptExplanation:
          "A picture graph shows information by using one picture (like a small drawing of a fruit or a shape) to represent one item. Each row or column in the graph represents a different category, and the number of pictures in that row tells you how many items are in that category. Reading a picture graph means counting the pictures in each row to answer questions like which category has the most or fewest items, or how many more items one category has than another. This one-picture-equals-one-item idea is the simplest starting point for organising and reading data, before graphs get more complex in later levels.",
        workedExamples: [
          {
            problem: "A picture graph shows 4 apple pictures in the 'Apples' row and 6 banana pictures in the 'Bananas' row. Which fruit has more, and how many more?",
            solution: [
              "Count the apple pictures: 4 apples.",
              "Count the banana pictures: 6 bananas.",
              "6 is greater than 4, so there are more bananas.",
              "6 - 4 = 2, so there are 2 more bananas than apples.",
            ],
          },
          {
            problem: "If each picture in a graph represents 1 student, and the 'Red' row has 5 pictures, how many students chose red?",
            solution: [
              "Each picture represents exactly 1 student.",
              "There are 5 pictures in the Red row.",
              "5 pictures × 1 student per picture = 5 students chose red.",
            ],
          },
        ],
        teachingSteps: [
          "Concrete: physically sort a small set of real objects (e.g. fruit, colours of blocks) into categories.",
          "Pictorial: transfer the physical sort into a picture graph, placing one picture per object in each category's row.",
          "Guided practice: read the completed picture graph together, answering 'which category has the most/fewest?'",
          "Guided practice: answer a simple comparison question requiring subtraction between two categories' totals.",
          "Independent practice: have students build their own picture graph from a new small data set and answer 2 questions about it.",
          "Check understanding: ask a student to explain what one picture in the graph represents, to confirm they understand the one-to-one correspondence.",
        ],
      },
    ],
  },
  {
    level: "P2",
    topics: [
      {
        title: "Numbers to 1,000",
        diagram: {
          type: "number-line",
          min: 0,
          max: 1000,
          step: 100,
          highlights: [
            { value: 300, label: "300", color: "primary" },
            { value: 700, label: "700", color: "primary" },
          ],
        },
        strand: "Number and Algebra",
        description:
          "Extends P1's place value to hundreds, tens and ones, including comparing, ordering and number patterns within 1,000. Base-ten blocks are still the most reliable way to make a 'hundred' feel concrete rather than abstract.",
        conceptExplanation:
          "This extends P1's place value idea by adding a new place: hundreds. In a three-digit number like 347, the '3' is worth 3 hundreds (300), the '4' is worth 4 tens (40), and the '7' is worth 7 ones (7). A 'hundred' can be thought of as 10 groups of ten bundled together, which is why base-ten blocks use a flat 'hundred' piece made of ten 'ten' rods. Comparing three-digit numbers works the same way as comparing two-digit numbers, but now you check the hundreds digit first, then the tens digit, then the ones digit, only moving to the next place if the current one is tied.",
        workedExamples: [
          {
            problem: "What is the value of the digit 4 in the number 462?",
            solution: [
              "Identify the place of the digit 4 in 462: it is in the hundreds place.",
              "A digit in the hundreds place is worth that digit × 100.",
              "4 × 100 = 400",
              "The digit 4 in 462 has a value of 400.",
            ],
          },
          {
            problem: "Which is bigger: 528 or 582?",
            solution: [
              "Compare the hundreds digit first: both numbers have 5 hundreds, so they are tied.",
              "Compare the tens digit next: 528 has 2 tens, 582 has 8 tens.",
              "8 tens is more than 2 tens, so 582 is bigger than 528.",
            ],
          },
        ],
        teachingSteps: [
          "Concrete: introduce the hundred-flat block, showing it's made of ten ten-rods bundled together, to extend the P1 base-ten model.",
          "Concrete: build a three-digit number with hundreds, tens and ones blocks, reading it aloud digit by digit.",
          "Pictorial: sketch the blocks as a simple hundreds-tens-ones drawing instead of using physical pieces.",
          "Abstract: write the number in expanded form (e.g. 347 = 300 + 40 + 7), linking each part back to the blocks drawn.",
          "Guided practice: compare and order 3-4 three-digit numbers together, checking the hundreds digit first, then tens, then ones.",
          "Independent practice: have students continue a simple number pattern (e.g. counting up by 10s or 100s) within 1,000.",
          "Check understanding: give two numbers with the same hundreds and tens but different ones digits, and ask which is larger and why.",
        ],
      },
      {
        title: "Addition and Subtraction within 1,000",
        strand: "Number and Algebra",
        description:
          "Adding and subtracting up to 3-digit numbers with regrouping (carrying/borrowing). Regrouping is the single biggest stumbling block at this level — slow down and use place-value discs before jumping to the column algorithm.",
        conceptExplanation:
          "Adding or subtracting 3-digit numbers works the same way as within 100, but now regrouping (carrying or borrowing) can happen across two columns instead of just one. When adding, if the ones add up to 10 or more, trade 10 ones for 1 ten and carry it into the tens column — and if that then makes the tens add up to 10 or more, trade 10 tens for 1 hundred and carry again. Subtraction with borrowing works in reverse: if a column doesn't have enough to subtract, borrow 1 from the column to its left, which is worth 10 in the current column. Writing out each regrouping step clearly (not skipping ahead) is what prevents errors when two regroupings happen in the same problem.",
        workedExamples: [
          {
            problem: "456 + 389 = ?",
            solution: [
              "Add the ones: 6 + 9 = 15. Write 5, carry 1 ten.",
              "Add the tens: 5 + 8 + 1 (carried) = 14. Write 4, carry 1 hundred.",
              "Add the hundreds: 4 + 3 + 1 (carried) = 8.",
              "456 + 389 = 845",
            ],
          },
          {
            problem: "500 - 268 = ?",
            solution: [
              "Subtract the ones: 0 - 8. Not enough, so borrow from the tens. But the tens digit is also 0, so borrow from the hundreds first.",
              "Borrow 1 hundred from the 5 hundreds, leaving 4 hundreds and making the tens column 10.",
              "Borrow 1 ten from that 10, leaving 9 tens and making the ones column 10.",
              "Subtract the ones: 10 - 8 = 2",
              "Subtract the tens: 9 - 6 = 3",
              "Subtract the hundreds: 4 - 2 = 2",
              "500 - 268 = 232",
            ],
          },
        ],
        teachingSteps: [
          "Concrete: use place-value discs to add two numbers where the ones column exceeds 10, physically trading 10 ones-discs for 1 tens-disc.",
          "Discuss: name this trade explicitly as 'regrouping' or 'carrying,' connecting the physical trade to the written column method.",
          "Pictorial: draw the discs and trade for one more addition example instead of using physical discs.",
          "Abstract: model the standard column addition algorithm, narrating exactly when and why a regroup happens.",
          "Guided practice: solve 2-3 subtraction problems requiring borrowing together, using discs first if a student struggles.",
          "Independent practice: have students solve one addition and one subtraction problem with regrouping on their own.",
          "Check understanding: give a subtraction problem where borrowing must happen across two columns (e.g. 500 - 268) and watch closely for where the process breaks down.",
        ],
      },
      {
        title: "Multiplication and Division Tables (2, 3, 4, 5, 10)",
        diagram: {
          type: "bar-model",
          bars: [
            {
              label: "3 × 4",
              segments: [
                { value: 4, label: "4" },
                { value: 4, label: "4" },
                { value: 4, label: "4" },
              ],
            },
          ],
        },
        strand: "Number and Algebra",
        description:
          "Building fluency with the multiplication and corresponding division facts for 2, 3, 4, 5 and 10, and understanding multiplication/division as inverse operations. Daily short drills work better than one long weekly session for memorisation.",
        conceptExplanation:
          "Multiplication facts (times tables) are the results of repeatedly adding the same number — the 4 times table is just 4, 8, 12, 16... (adding 4 each time). Division facts are the inverse: if you know 4 × 3 = 12, you automatically know 12 ÷ 4 = 3 and 12 ÷ 3 = 4, because division 'undoes' multiplication. Arranging objects into rows and columns (an array) makes this inverse relationship visible: an array of 4 rows and 3 columns shows both '4 groups of 3' (multiplication) and 'sharing 12 into 4 equal rows' (division) at the same time. Fluency with these facts (fast recall, not re-counting each time) is what makes later multi-digit multiplication and division manageable.",
        workedExamples: [
          {
            problem: "What is 4 × 5?",
            solution: ["4 × 5 means 4 groups of 5, or 5 added 4 times.", "5 + 5 = 10, 10 + 5 = 15, 15 + 5 = 20", "4 × 5 = 20"],
          },
          {
            problem: "If 3 × 5 = 15, what is 15 ÷ 5?",
            solution: [
              "Multiplication and division are inverse operations — division undoes multiplication.",
              "Since 3 groups of 5 make 15, sharing 15 into groups of 5 must give 3 groups.",
              "15 ÷ 5 = 3",
            ],
          },
        ],
        teachingSteps: [
          "Concrete: build one times table (e.g. the 2 times table) using equal groups of objects, counting the total after each new group is added.",
          "Pictorial: represent the same table as an array (rows and columns of dots) to show the pattern visually.",
          "Discuss: use the array to show the matching division fact (e.g. if 4 groups of 2 make 8, then 8 shared into 4 groups gives 2), making the inverse relationship explicit.",
          "Guided practice: chant or drill the table together, then immediately drill its matching division facts.",
          "Independent practice: give a short, timed mixed set of multiplication and division facts for the table just learned.",
          "Check understanding: ask a student to solve one division fact by 'thinking multiplication backwards' to confirm they see the inverse link, not just memorised isolated facts.",
        ],
      },
      {
        title: "2D and 3D Shapes",
        diagram: {
          type: "shape-grid",
          rows: 3,
          cols: 4,
          shadedCells: [
            [0, 1],
            [0, 2],
            [1, 1],
            [1, 2],
          ],
          caption: "A rectangle made of unit squares",
        },
        strand: "Measurement and Geometry",
        description:
          "Identifying common 3D shapes (cube, cuboid, cylinder, cone, sphere) alongside 2D shapes, and forming patterns by combining shapes. Physical shape sets help far more than pictures for younger students distinguishing faces, edges and corners.",
        conceptExplanation:
          "3D shapes are solid shapes with three dimensions (length, width and height), unlike flat 2D shapes. They are described using three properties: faces (the flat or curved surfaces), edges (the lines where two faces meet), and vertices/corners (the points where edges meet). A cube has 6 flat square faces, 12 edges and 8 corners, while a cuboid also has 6 faces, 12 edges and 8 corners but its faces are rectangles of different sizes. Shapes like the cylinder, cone and sphere have curved surfaces, which is why they can roll, unlike shapes made only of flat faces which can only slide or stack.",
        workedExamples: [
          {
            problem: "How many faces, edges and corners does a cube have?",
            solution: [
              "A cube has 6 flat square faces (top, bottom, and 4 sides).",
              "It has 12 edges, where pairs of faces meet.",
              "It has 8 corners, where edges meet.",
              "A cube has 6 faces, 12 edges and 8 corners.",
            ],
          },
          {
            problem: "Why can a cylinder roll but a cube cannot?",
            solution: [
              "A cylinder has a curved surface running around its side.",
              "A cube has only flat faces, with no curved surface.",
              "An object can roll smoothly when it has a curved surface; flat faces make an object slide or stack instead. This is why the cylinder can roll but the cube cannot.",
            ],
          },
        ],
        teachingSteps: [
          "Concrete: hand out physical 3D shape models and have students find and count faces, edges and corners by touch.",
          "Discuss: compare a cube and a cuboid side by side, identifying what's the same (6 faces) and different (equal vs. unequal side lengths).",
          "Concrete: sort the 3D shapes by whether they roll, stack, or slide, connecting the physical behaviour to their properties.",
          "Pictorial: match each 3D shape to its 2D picture representation on a worksheet.",
          "Guided practice: use a mix of 2D and 3D shape pieces to build a simple repeating pattern together.",
          "Independent practice: have students create and describe their own shape pattern using at least two different shapes.",
          "Check understanding: show a cylinder and ask a student whether it's closer to a circle or a cube in its properties, and why.",
        ],
      },
      {
        title: "Length, Mass and Volume",
        strand: "Measurement and Geometry",
        description:
          "Measuring length in metres/centimetres, mass in kilograms/grams, and volume of liquid in litres, using standard measuring tools for the first time. Let students actually weigh and measure classroom objects rather than only reading numbers off a page.",
        conceptExplanation:
          "This topic introduces standard units for the first time, replacing the non-standard units (paperclips, hand spans) used in P1: length is measured in metres (m) and centimetres (cm), mass in kilograms (kg) and grams (g), and volume of liquid in litres (l). Standard units are important because they mean the same thing everywhere — a centimetre measured by one person is exactly the same as a centimetre measured by anyone else, unlike a hand span which is different for every person. Reading a measuring tool correctly (a ruler, a weighing scale, or a measuring cylinder) means lining up the object or liquid with the scale's zero point and reading off the value at the correct end or level.",
        workedExamples: [
          {
            problem: "A ruler shows a pencil starts at the 0 cm mark and ends at the 14 cm mark. How long is the pencil?",
            solution: ["The pencil starts at 0 cm and ends at 14 cm.", "The length is the difference between the start and end readings: 14 - 0 = 14", "The pencil is 14 cm long."],
          },
          {
            problem: "A bag of rice weighs 2 kg. A bag of flour weighs 750 g. Which is heavier?",
            solution: [
              "Convert both to the same unit: 2 kg = 2000 g",
              "Compare: 2000 g (rice) versus 750 g (flour)",
              "2000 g is greater than 750 g, so the bag of rice is heavier.",
            ],
          },
        ],
        teachingSteps: [
          "Concrete: measure a classroom object's length using a real ruler or metre stick, reading the scale together carefully.",
          "Concrete: weigh a real object on a simple balance or scale, reading the mass in grams or kilograms.",
          "Concrete: pour water into a measuring container to a marked line, reading the volume in litres.",
          "Discuss: compare estimating a measurement first, then checking with the actual tool, to build a sense of what each unit 'feels like.'",
          "Guided practice: measure 2-3 more objects together, alternating which unit (length, mass, volume) is used.",
          "Independent practice: have students measure one object each for length, mass and volume and record the results.",
          "Check understanding: ask a student to estimate a new object's mass before weighing it, to check their number sense for the unit.",
        ],
      },
      {
        title: "Picture Graphs with Scales",
        strand: "Statistics",
        description:
          "Reading picture graphs where one symbol now represents more than one unit (e.g. 1 picture = 2 units), which is a genuine conceptual jump from P1. Explicitly point out the graph's key/legend every time — students often ignore it and miscount.",
        conceptExplanation:
          "In a scaled picture graph, one picture no longer stands for just one item — the graph's key (or legend) tells you what each picture represents, for example '1 picture = 2 students.' To find the total for a category, count the number of pictures in that row and multiply by the value shown in the key, rather than just counting the pictures directly. This is a genuine jump in difficulty from P1's one-picture-equals-one-item graphs, because forgetting to check the key (or forgetting to multiply) is an easy mistake to make. Always read the key first, before looking at any row of the graph.",
        workedExamples: [
          {
            problem: "A picture graph's key says '1 picture = 2 pets.' The 'Dogs' row has 3 pictures. How many dogs are there?",
            solution: [
              "The key shows each picture represents 2 pets.",
              "There are 3 pictures in the Dogs row.",
              "3 pictures × 2 pets per picture = 6",
              "There are 6 dogs.",
            ],
          },
          {
            problem: "Using the same key (1 picture = 2 pets), how many pictures would you draw to show 8 cats?",
            solution: [
              "Each picture represents 2 pets.",
              "To show 8 pets, divide the total by the value per picture: 8 ÷ 2 = 4",
              "You would draw 4 pictures to show 8 cats.",
            ],
          },
        ],
        teachingSteps: [
          "Discuss: show a picture graph and explicitly ask students to find and read the key/legend before looking at any data.",
          "Concrete: build a small scaled picture graph together, physically grouping 2 real objects per picture symbol drawn.",
          "Guided practice: read the completed graph together, calculating totals by multiplying pictures by the key's value, not just counting pictures.",
          "Guided practice: answer a comparison question between two categories, checking the scale is applied consistently.",
          "Independent practice: have students answer 2-3 questions on a new scaled picture graph on their own.",
          "Check understanding: deliberately ask 'how many pictures for 6 units' to confirm the student is dividing by the scale correctly, not just guessing.",
        ],
      },
    ],
  },
  {
    level: "P3",
    topics: [
      {
        title: "Whole Numbers to 10,000",
        strand: "Number and Algebra",
        description:
          "Place value, comparing and rounding numbers up to 10,000. Rounding is new and commonly confused with truncating — anchor it with a number line showing which 'landmark' number is closer.",
        conceptExplanation:
          "This extends place value to four digits, adding the thousands place: in 3,472, the '3' is worth 3 thousands (3000). Rounding means expressing a number as the nearest 'round' number (like the nearest 10, 100, or 1000) to make it easier to work with or estimate. To round, find the two round numbers the actual number sits between (the 'landmarks'), then decide which one it's closer to — if the number is exactly halfway or past the midpoint, it rounds up to the higher landmark; otherwise it rounds down to the lower one. Rounding is different from truncating (just chopping off digits), which is a common confusion — 4,950 rounded to the nearest 100 is 5,000 (rounds up), not 4,900.",
        workedExamples: [
          {
            problem: "Round 3,847 to the nearest 100.",
            solution: [
              "Find the two nearest hundreds: 3,800 and 3,900.",
              "Look at the tens digit (4) to decide which is closer — the halfway point is 3,850.",
              "3,847 is less than 3,850, so it is closer to 3,800.",
              "3,847 rounded to the nearest 100 is 3,800.",
            ],
          },
          {
            problem: "Round 3,950 to the nearest 100.",
            solution: [
              "Find the two nearest hundreds: 3,900 and 4,000.",
              "The halfway point between them is 3,950.",
              "3,950 is exactly at the halfway point, so by the rounding rule it rounds up.",
              "3,950 rounded to the nearest 100 is 4,000.",
            ],
          },
        ],
        teachingSteps: [
          "Concrete/Pictorial: extend the base-ten block model to thousands using a sketch (since physical thousand-blocks are impractical), building a four-digit number visually.",
          "Guided practice: compare and order 3-4 four-digit numbers together, checking place value column by column from the left.",
          "Discuss: introduce rounding by drawing a number line between two 'landmark' round numbers (e.g. 3000 and 4000) and marking where the actual number sits.",
          "Model: round one number to the nearest 1000 by asking which landmark it's closer to on the number line, not just applying a digit rule blindly.",
          "Guided practice: round 2-3 more numbers to the nearest 10, 100 and 1000 together, always checking against the number line first.",
          "Independent practice: have students round a set of numbers themselves, then place each on a rough number line to justify the answer.",
          "Check understanding: give a number that rounds up unexpectedly (e.g. 3950 to the nearest 100) to test whether truncating is being mistaken for rounding.",
        ],
      },
      {
        title: "The Four Operations",
        strand: "Number and Algebra",
        description:
          "Multiplying and dividing up to 4-digit numbers by a 1-digit number, and solving two-step word problems combining operations. Model problems can help students see which operation a word problem calls for before they compute.",
        conceptExplanation:
          "This topic scales up multiplication and division to larger numbers (up to 4 digits by a 1-digit number), using the same column methods as before but with more digits to keep track of. Long division follows a repeating 4-step cycle at each digit: divide, multiply, subtract, then bring down the next digit. Two-step word problems require figuring out which operation to do first and which to do second — drawing a simple bar model or diagram to represent the problem often makes this ordering clear before any calculating starts.",
        workedExamples: [
          {
            problem: "A school orders 1,248 pencils, packed equally into 4 boxes. How many pencils are in each box?",
            solution: [
              "This is a division problem: 1,248 ÷ 4",
              "Divide the thousands and hundreds together (12 ÷ 4 = 3, using the first two digits 1248 → 12): 3",
              "Bring down the next digit (4): 4 ÷ 4 = 1",
              "Bring down the last digit (8): 8 ÷ 4 = 2",
              "1,248 ÷ 4 = 312 pencils in each box.",
            ],
          },
          {
            problem: "A shop has 235 boxes of apples, each with 6 apples. 158 apples are sold. How many apples are left?",
            solution: [
              "Step 1: Find the total number of apples: 235 × 6",
              "235 × 6 = 1,410 apples in total",
              "Step 2: Subtract the apples sold: 1,410 - 158",
              "1,410 - 158 = 1,252",
              "There are 1,252 apples left.",
            ],
          },
        ],
        teachingSteps: [
          "Review: revisit the column multiplication algorithm on a 2-digit by 1-digit example before extending to 4 digits.",
          "Model: work through one 4-digit by 1-digit multiplication, narrating each regrouping step explicitly.",
          "Model: work through one long division example, explaining each 'divide, multiply, subtract, bring down' step.",
          "Guided practice: solve 2-3 more multiplication and division problems together.",
          "Model: for a two-step word problem, draw a simple bar model first to decide which operation comes first, before calculating anything.",
          "Independent practice: have students solve one two-step word problem, requiring a bar model or diagram before the calculation.",
          "Check understanding: ask a student to explain in words why they chose each operation in their two-step solution, not just show the working.",
        ],
      },
      {
        title: "Fractions",
        strand: "Number and Algebra",
        description:
          "Introduces fractions as parts of a whole, equivalent fractions, and comparing/ordering fractions with the same denominator. Fraction strips or paper-folding make equivalence tangible in a way that symbols alone don't.",
        conceptExplanation:
          "A fraction represents a part of a whole that has been divided into equal parts. The bottom number (denominator) tells you how many equal parts the whole is divided into, and the top number (numerator) tells you how many of those parts are being considered. Equivalent fractions are different fractions that represent the exact same amount — for example, 1/2 and 2/4 cover the same portion of a whole, just cut into a different number of pieces. Comparing fractions with the same denominator is straightforward: since the pieces are the same size, the fraction with the bigger numerator represents more.",
        workedExamples: [
          {
            problem: "A pizza is cut into 8 equal slices. If 3 slices are eaten, what fraction of the pizza is eaten?",
            solution: [
              "The whole pizza is divided into 8 equal parts, so the denominator is 8.",
              "3 slices (parts) have been eaten, so the numerator is 3.",
              "The fraction of pizza eaten is 3/8.",
            ],
          },
          {
            problem: "Which is bigger: 3/5 or 4/5?",
            solution: [
              "Both fractions have the same denominator (5), meaning the whole is divided into equally-sized fifths.",
              "Since the pieces are the same size, compare the numerators directly: 4 is greater than 3.",
              "4/5 is bigger than 3/5.",
            ],
          },
        ],
        teachingSteps: [
          "Concrete: fold a paper strip into equal parts and shade some, naming the fraction from the folded model.",
          "Concrete: fold a second identical strip into a different number of equal parts and shade the equivalent amount, physically laying them side by side to show equivalence.",
          "Pictorial: draw the two paper-strip models to record the equivalent fraction pair discovered.",
          "Abstract: write both fractions as numbers, noticing the numerator/denominator relationship between them.",
          "Guided practice: compare and order 3-4 fractions with the same denominator using fraction strips, then confirm using the numbers alone.",
          "Independent practice: have students find one equivalent fraction for a given fraction using their own paper strip.",
          "Check understanding: ask why 1/2 and 2/4 cover the same amount of the strip despite having different numbers, to confirm real conceptual understanding.",
        ],
      },
      {
        title: "Length, Mass and Volume (Word Problems)",
        strand: "Measurement and Geometry",
        description:
          "Applying the P2 measurement units to two-step word problems, including converting between units (e.g. m and cm). Converting units is the main new skill — drill the relationships (1 m = 100 cm etc.) before mixing them into word problems.",
        conceptExplanation:
          "This topic applies the P2 measurement units to word problems, with the added skill of converting between units — for example, changing metres to centimetres, or kilograms to grams. The key conversion facts to memorise are 1 m = 100 cm, 1 km = 1000 m, 1 kg = 1000 g, and 1 l = 1000 ml. In a word problem, if two measurements are given in different units (say, metres and centimetres), they must be converted to the SAME unit before they can be added, subtracted, or compared — mixing units without converting first is a common source of wrong answers.",
        workedExamples: [
          {
            problem: "A rope is 2 m 35 cm long. Another rope is 180 cm long. What is the total length in centimetres?",
            solution: [
              "Convert the first rope to centimetres: 2 m = 200 cm, so 2 m 35 cm = 200 + 35 = 235 cm",
              "The second rope is already in centimetres: 180 cm",
              "Add the two lengths in the same unit: 235 + 180 = 415",
              "The total length is 415 cm.",
            ],
          },
          {
            problem: "A bag of sugar weighs 1 kg 250 g. If 400 g is used, how much sugar is left, in grams?",
            solution: [
              "Convert the total to grams: 1 kg = 1000 g, so 1 kg 250 g = 1000 + 250 = 1250 g",
              "Subtract the amount used: 1250 - 400",
              "1250 - 400 = 850",
              "There are 850 g of sugar left.",
            ],
          },
        ],
        teachingSteps: [
          "Review: recap the P2 measurement units and drill the key conversion facts (1 m = 100 cm, 1 kg = 1000 g, 1 l = 1000 ml) on their own first.",
          "Model: convert one measurement between units, explicitly stating which conversion fact was used and why.",
          "Guided practice: convert 3-4 more measurements together before touching any word problem.",
          "Model: solve a two-step word problem involving a unit conversion, drawing a bar model to plan the steps before calculating.",
          "Guided practice: solve one more conversion word problem together, alternating who leads each step.",
          "Independent practice: have students solve a word problem requiring both a conversion and a two-step calculation.",
          "Check understanding: give a problem where units are mismatched (m and cm in the same question) to see if students convert before calculating rather than mixing units.",
        ],
      },
      {
        title: "Time",
        strand: "Measurement and Geometry",
        description:
          "Reading time to the minute, and calculating duration across the hour (e.g. from 10:45 to 11:20). Use an analogue clock face physically, not just digital times on paper — duration-across-the-hour is where most errors happen.",
        conceptExplanation:
          "Reading time to the minute means reading both the hour hand's position and exactly where the minute hand points among the 60 small marks around the clock face. Calculating duration (how much time has passed) is straightforward when the times don't cross the hour, but needs an extra strategy when they do — for example, from 10:45 to 11:20 crosses from one hour into the next. The reliable strategy is to split the calculation into two parts: first find the minutes from the start time to the next full hour, then add the minutes from that full hour to the end time.",
        workedExamples: [
          {
            problem: "A movie starts at 2:40 pm and ends at 4:15 pm. How long is the movie?",
            solution: [
              "This duration crosses the hour more than once, so split it into stages.",
              "From 2:40 pm to 3:00 pm is 20 minutes.",
              "From 3:00 pm to 4:00 pm is a full 1 hour (60 minutes).",
              "From 4:00 pm to 4:15 pm is 15 minutes.",
              "Total: 20 + 60 + 15 = 95 minutes, which is 1 hour 35 minutes.",
            ],
          },
          {
            problem: "A train journey starts at 10:45 am and ends at 11:20 am. How long is the journey?",
            solution: [
              "From 10:45 am to 11:00 am (the next full hour) is 15 minutes.",
              "From 11:00 am to 11:20 am is 20 minutes.",
              "Total duration: 15 + 20 = 35 minutes.",
            ],
          },
        ],
        teachingSteps: [
          "Concrete: use a real analogue clock to read time to the minute, having students state both the hour and minute hand positions.",
          "Model: physically move the minute hand from a start time to an end time that crosses the hour, counting the minutes passed on the clock face.",
          "Discuss: break the crossing-the-hour duration into two parts (minutes to the hour, then minutes after) as an explicit strategy.",
          "Guided practice: calculate 2-3 more durations together, always starting by checking whether the hour is crossed.",
          "Independent practice: have students calculate one duration that crosses the hour and one that doesn't, on their own.",
          "Check understanding: give a duration problem and ask the student to explain their method aloud, watching specifically for the hour-crossing step.",
        ],
      },
      {
        title: "Angles",
        strand: "Measurement and Geometry",
        description:
          "First formal introduction to angles as a measure of turning, identifying right angles and comparing angles as bigger/smaller than a right angle (no protractor yet). A door swinging open is a good everyday model for what an angle actually is.",
        conceptExplanation:
          "An angle measures the amount of 'turning' between two lines that meet at a point — like how far a door has swung open from its closed position. A right angle is a specific, common amount of turning (a quarter turn, like the corner of a square piece of paper), and it acts as a reference point for describing other angles: an angle can be described as smaller than a right angle, exactly a right angle, or bigger than a right angle. At this stage, angles are compared by eye or using a simple right-angle tester (like a folded paper corner) rather than measured precisely in degrees, since formal degree measurement with a protractor comes later at P4.",
        workedExamples: [
          {
            problem: "You test a corner of a table with a paper right-angle checker and it fits exactly. What can you say about that angle?",
            solution: [
              "The paper right-angle checker represents exactly one right angle (a quarter turn).",
              "If it fits the table corner exactly with no gap and no overlap, the table corner is exactly a right angle.",
            ],
          },
          {
            problem: "An angle looks wider than the corner of a piece of paper. Is it bigger or smaller than a right angle?",
            solution: [
              "The corner of a piece of paper represents a right angle.",
              "An angle that looks wider (more 'opened up') than a right angle has turned further.",
              "The angle is bigger than a right angle.",
            ],
          },
        ],
        teachingSteps: [
          "Concrete: physically open a door (or a book) partway and discuss the 'turning' between the two positions as the angle.",
          "Concrete: use a paper right-angle checker (a folded paper corner) to test which classroom corners are exactly right angles.",
          "Discuss: sort a few drawn angles into 'bigger than a right angle,' 'smaller than a right angle,' and 'exactly a right angle' using the paper checker.",
          "Guided practice: identify right angles in a set of shapes together, checking each with the paper tool.",
          "Independent practice: have students find and check 3 angles in the classroom or on a worksheet using their own paper right-angle checker.",
          "Check understanding: show an angle that looks close to a right angle but isn't, and have a student test it with the checker rather than guessing by eye.",
        ],
      },
      {
        title: "Area and Perimeter",
        strand: "Measurement and Geometry",
        description:
          "Finding the area of a figure by counting unit squares and the perimeter by adding up side lengths, for rectangles and simple composite figures. Students frequently confuse area and perimeter — keep asking whether they're covering the surface or walking around the edge.",
        conceptExplanation:
          "Area measures how much surface a shape covers, found by counting how many unit squares fit inside it — for a rectangle, this is the same as length × width. Perimeter measures the total distance around the outside edge of a shape, found by adding up the lengths of all its sides. These two measurements answer very different questions: area tells you how much space something covers (like how much carpet you need), while perimeter tells you the distance around the boundary (like how much fencing you need). A common confusion is mixing the two up, so it helps to always ask 'am I covering the inside, or walking around the outside?' before calculating.",
        workedExamples: [
          {
            problem: "A rectangle is 6 cm long and 4 cm wide. Find its area and perimeter.",
            solution: [
              "Area = length × width = 6 × 4 = 24 cm²",
              "Perimeter = add all four sides = 6 + 4 + 6 + 4",
              "Perimeter = 20 cm",
              "The area is 24 cm² and the perimeter is 20 cm.",
            ],
          },
          {
            problem: "A square has a perimeter of 20 cm. What is the length of one side?",
            solution: [
              "A square has 4 equal sides, and perimeter is the total of all 4 sides.",
              "One side = perimeter ÷ 4 = 20 ÷ 4",
              "One side = 5 cm.",
            ],
          },
        ],
        teachingSteps: [
          "Concrete: cover a rectangle drawn on grid paper with unit-square tiles, counting the total to find area.",
          "Concrete: trace a finger around the outside edge of the same rectangle while counting units, to find perimeter, contrasting it directly with the area just found.",
          "Discuss: explicitly name the distinction — area covers the surface, perimeter walks around the edge — and revisit it after every practice question.",
          "Guided practice: find the area and perimeter of 2-3 more rectangles together, asking 'covering or walking around?' before each calculation.",
          "Independent practice: have students find the area and perimeter of a simple composite figure made of two rectangles.",
          "Check understanding: ask a student which measurement (area or perimeter) they'd use to buy fencing versus buying grass seed, to test real conceptual grasp.",
        ],
      },
      {
        title: "Bar Graphs",
        strand: "Statistics",
        description:
          "Reading and drawing bar graphs, including comparing categories and finding the difference between the highest and lowest bars. This is where data-handling moves from picture graphs to a more abstract, quantitative representation.",
        conceptExplanation:
          "A bar graph shows data using bars of different heights (or lengths), where the height of each bar represents a quantity, read off against a scale on the axis. Unlike a picture graph, a bar graph shows the exact quantity as a continuous height rather than counting individual pictures, which makes it better for showing precise or larger numbers. Reading a bar graph means checking the scale carefully (what does each gridline represent?), then reading where the top of each bar lines up against that scale. Comparing bars means looking at which is tallest/shortest, or subtracting two bars' values to find the difference between them.",
        workedExamples: [
          {
            problem: "A bar graph shows books read by 4 students: Alex - 8 books, Ben - 5 books, Cara - 8 books, Dee - 3 books. Who read the most, and how many more than Dee?",
            solution: [
              "Compare all the bars: Alex (8), Ben (5), Cara (8), Dee (3).",
              "The tallest bars belong to Alex and Cara, both at 8 books — the most.",
              "Find the difference from Dee: 8 - 3 = 5",
              "Alex and Cara read the most (8 books each), which is 5 more books than Dee.",
            ],
          },
          {
            problem: "On a bar graph with a scale going up in 2s (0, 2, 4, 6...), a bar's top is exactly halfway between the 6 and 8 marks. What value does the bar show?",
            solution: [
              "The gridlines are 6 and 8, which are 2 apart.",
              "Halfway between 6 and 8 is 6 + 1 = 7 (or 8 - 1 = 7).",
              "The bar shows a value of 7.",
            ],
          },
        ],
        teachingSteps: [
          "Review: connect back to P2's scaled picture graphs, discussing how a bar graph shows the same idea with a continuous bar instead of counted pictures.",
          "Concrete/Pictorial: build a bar graph together from a small real data set, plotting the height of each bar against the scale.",
          "Guided practice: read the completed bar graph, answering 'which category is highest/lowest?'",
          "Guided practice: calculate the difference between the highest and lowest bars, modelling the subtraction explicitly.",
          "Independent practice: have students draw their own bar graph from a new data set and answer 2 comparison questions.",
          "Check understanding: ask a student to read a bar's value where it falls between two scale marks, to check they can interpret the scale accurately.",
        ],
      },
    ],
  },
  {
    level: "P4",
    topics: [
      {
        title: "Whole Numbers to 100,000",
        strand: "Number and Algebra",
        description:
          "Extends place value and the four operations to numbers up to 100,000, including multiplying/dividing by a 2-digit number. This is largely a scale-up of P3 skills — the main new challenge is the long multiplication/division algorithm itself.",
        conceptExplanation:
          "This extends place value further to five and six digits (ten thousands and hundred thousands), and scales up multiplication and division to include a 2-digit multiplier or divisor. Multiplying by a 2-digit number works by splitting it into its tens and ones parts, multiplying by each part separately, and adding the two results together (this is why it's called the 'partial products' method). Long division by a 2-digit number follows the same divide-multiply-subtract-bring-down cycle as division by a 1-digit number, but each step now involves estimating how many times the 2-digit divisor fits, which takes more practice to get comfortable with.",
        workedExamples: [
          {
            problem: "23 × 14 = ?",
            solution: [
              "Split 14 into 10 and 4.",
              "Multiply by the ones part: 23 × 4 = 92",
              "Multiply by the tens part: 23 × 10 = 230",
              "Add the two partial products: 92 + 230 = 322",
              "23 × 14 = 322",
            ],
          },
          {
            problem: "936 ÷ 12 = ?",
            solution: [
              "Estimate how many times 12 fits into the first digits: 12 fits into 93 about 7 times (12 × 7 = 84).",
              "Subtract: 93 - 84 = 9, bring down the next digit (6) to make 96.",
              "12 fits into 96 exactly 8 times (12 × 8 = 96).",
              "Subtract: 96 - 96 = 0.",
              "936 ÷ 12 = 78",
            ],
          },
        ],
        teachingSteps: [
          "Review: quickly recap place value and the P3 operations before introducing anything new, to confirm the foundation is solid.",
          "Model: work through one multiplication by a 2-digit number, breaking it into multiplying by the ones digit, then the tens digit, then adding the two results.",
          "Guided practice: solve 2-3 more 2-digit multiplications together, narrating each partial product.",
          "Model: work through one long division by a 2-digit number, slowing down on the estimate-and-check step.",
          "Guided practice: solve one more long division problem together.",
          "Independent practice: have students solve one multiplication and one division problem with 2-digit numbers on their own.",
          "Check understanding: ask a student to estimate the answer to a 2-digit multiplication before calculating, to build a sanity-check habit against place-value slips.",
        ],
      },
      {
        title: "Factors and Multiples",
        strand: "Number and Algebra",
        description:
          "A genuinely new topic: finding factors, multiples, common factors and common multiples of numbers. Students often confuse a factor with a multiple — anchor 'factor' with 'divides into' and 'multiple' with 'times table of'.",
        conceptExplanation:
          "A factor of a number is a whole number that divides into it exactly, with nothing left over — for example, 3 is a factor of 12 because 12 ÷ 3 = 4 exactly. A multiple of a number is what you get when you multiply it by a whole number — 12 is a multiple of 3 because 3 × 4 = 12. Every number has a limited set of factors (you can find them all by checking which numbers divide in evenly) but an endless list of multiples (you can always multiply by a bigger number). A common factor is a factor shared by two numbers, and a common multiple is a multiple shared by two numbers — finding these is useful for comparing or combining fractions later on.",
        workedExamples: [
          {
            problem: "List all the factors of 18.",
            solution: [
              "Check each number from 1 up to 18 to see if it divides into 18 exactly.",
              "1 × 18 = 18, so 1 and 18 are factors.",
              "2 × 9 = 18, so 2 and 9 are factors.",
              "3 × 6 = 18, so 3 and 6 are factors.",
              "4 and 5 do not divide evenly into 18.",
              "The factors of 18 are 1, 2, 3, 6, 9, and 18.",
            ],
          },
          {
            problem: "Find the common factors of 12 and 18.",
            solution: [
              "Factors of 12: 1, 2, 3, 4, 6, 12",
              "Factors of 18: 1, 2, 3, 6, 9, 18",
              "Compare the two lists for numbers that appear in both: 1, 2, 3, and 6 appear in both lists.",
              "The common factors of 12 and 18 are 1, 2, 3, and 6.",
            ],
          },
        ],
        teachingSteps: [
          "Concrete: arrange 12 counters into every possible equal-row array (1x12, 2x6, 3x4) to physically find all the factors of 12.",
          "Discuss: define factor as 'divides into evenly' using the arrays just built, and multiple as 'a number in its times table,' explicitly contrasting the two.",
          "Guided practice: list the factors of 2-3 more numbers together, checking each candidate by division.",
          "Guided practice: list the first several multiples of a number together, connecting it to the times table.",
          "Model: find the common factors of two numbers by comparing their factor lists side by side.",
          "Independent practice: have students find the common factors and common multiples of a new pair of numbers.",
          "Check understanding: ask a student whether 3 is a factor or a multiple of 12, and to explain their reasoning using the definitions.",
        ],
      },
      {
        title: "Fractions",
        strand: "Number and Algebra",
        description:
          "Adding and subtracting fractions with different denominators, and working with mixed numbers and improper fractions. Finding a common denominator is the crux skill here — connect it directly back to the P4 factors/multiples topic.",
        conceptExplanation:
          "Adding or subtracting fractions with different denominators requires first converting them to equivalent fractions with the SAME denominator, called the common denominator — this must be a common multiple of both original denominators. Once both fractions have the same denominator, the numerators can be added or subtracted directly, and the denominator stays the same. A mixed number (like 2 1/3) combines a whole number and a fraction, while an improper fraction (like 7/3) has a numerator bigger than its denominator — both represent the same value and can be converted between each other.",
        workedExamples: [
          {
            problem: "1/2 + 1/3 = ?",
            solution: [
              "The denominators (2 and 3) are different, so find a common denominator: the smallest common multiple of 2 and 3 is 6.",
              "Convert 1/2 to sixths: 1/2 = 3/6",
              "Convert 1/3 to sixths: 1/3 = 2/6",
              "Add the numerators: 3/6 + 2/6 = 5/6",
              "1/2 + 1/3 = 5/6",
            ],
          },
          {
            problem: "Convert 7/3 to a mixed number.",
            solution: [
              "Divide the numerator by the denominator: 7 ÷ 3 = 2 remainder 1",
              "The whole number part is 2 (how many whole times 3 fits into 7).",
              "The remainder (1) becomes the new numerator, keeping the same denominator (3).",
              "7/3 = 2 1/3",
            ],
          },
        ],
        teachingSteps: [
          "Review: connect back to the factors/multiples topic, reminding students that a common denominator is a common multiple of the two denominators.",
          "Concrete/Pictorial: use fraction strips to show why 1/2 + 1/3 can't be added directly, converting both to a common-denominator equivalent first.",
          "Model: work through finding a common denominator and adding two fractions, step by step.",
          "Guided practice: solve 2-3 more addition and subtraction problems with different denominators together.",
          "Model: convert between mixed numbers and improper fractions using a diagram, then abstractly.",
          "Independent practice: have students solve one addition and one subtraction problem, including at least one mixed number.",
          "Check understanding: ask a student to explain why they can't just add the numerators and denominators straight across, referencing the fraction-strip model.",
        ],
      },
      {
        title: "Decimals",
        strand: "Number and Algebra",
        description:
          "Introduces decimals to two decimal places, their relationship to fractions (tenths and hundredths), and the four operations on decimals. Base-ten place-value discs extended to tenths/hundredths make the fraction-decimal link concrete.",
        conceptExplanation:
          "A decimal is another way to write a fraction whose denominator is 10, 100, or 1000 — the digits after the decimal point represent tenths, then hundredths, then thousandths. For example, 0.4 means 4 tenths (4/10), and 0.45 means 4 tenths and 5 hundredths (45/100). Comparing decimals means comparing digit by digit from the left, just like whole numbers — 0.45 is bigger than 0.4 because when written with the same number of decimal places (0.40 vs 0.45), the hundredths digit (5 vs 0) is what makes the difference, not the fact that 0.45 has 'more digits.'",
        workedExamples: [
          {
            problem: "Which is bigger: 0.4 or 0.45?",
            solution: [
              "Write both with the same number of decimal places: 0.4 = 0.40",
              "Compare digit by digit: the tenths digit is 4 in both.",
              "Compare the hundredths digit: 0.40 has 0, 0.45 has 5.",
              "5 is greater than 0, so 0.45 is bigger than 0.4 (even though 0.4 has fewer digits written).",
            ],
          },
          {
            problem: "3.6 + 2.75 = ?",
            solution: [
              "Line up the decimal points: 3.60 and 2.75 (writing 3.6 as 3.60 to match places).",
              "Add the hundredths: 0 + 5 = 5",
              "Add the tenths: 6 + 7 = 13, write 3, carry 1",
              "Add the ones: 3 + 2 + 1 (carried) = 6",
              "3.6 + 2.75 = 6.35",
            ],
          },
        ],
        teachingSteps: [
          "Concrete: extend the place-value disc model below the ones place to show tenths and hundredths discs.",
          "Discuss: connect a shaded tenths grid (like a fraction diagram) directly to its decimal notation, showing 0.1 = 1/10.",
          "Model: add two decimals using the place-value discs, aligning the decimal points explicitly.",
          "Guided practice: solve 2-3 more decimal addition/subtraction problems together, always checking decimal-point alignment first.",
          "Model: multiply a decimal by a whole number, connecting it to repeated addition of the decimal discs.",
          "Independent practice: have students solve one decimal addition and one decimal multiplication problem.",
          "Check understanding: ask a student to compare 0.4 and 0.45 and explain which is larger using the hundredths grid, since this is a very common misconception point.",
        ],
      },
      {
        title: "Angles and Line Symmetry",
        strand: "Measurement and Geometry",
        description:
          "Measuring angles in degrees with a protractor for the first time, and identifying lines of symmetry in figures. Protractor misreads (using the wrong scale) are the most common error — always have students estimate first, then measure.",
        conceptExplanation:
          "Angles are now measured precisely in degrees using a protractor, where a full turn is 360°, a right angle is exactly 90°, and a straight line is 180°. Using a protractor correctly means lining up its centre point and base line exactly with the angle's vertex and one arm, then reading off the degree value where the other arm crosses the scale — protractors have two scales running in opposite directions, so estimating the angle first (is it acute, roughly a right angle, or obtuse?) helps catch a wrong-scale reading. Line symmetry means a shape can be folded exactly in half along a line (the line of symmetry) so that both halves match perfectly — some shapes have one line of symmetry, some have several, and some have none at all.",
        workedExamples: [
          {
            problem: "An angle is estimated by eye to be a bit more than a right angle. When measured with a protractor, the reading could be 70° or 110° depending on which scale is used. Which reading is correct?",
            solution: [
              "A right angle is 90°.",
              "The angle was estimated as a bit MORE than 90° (a right angle).",
              "70° is less than 90°, and 110° is more than 90°.",
              "Since the angle looks bigger than a right angle, 110° is the correct reading, not 70°.",
            ],
          },
          {
            problem: "A square is folded along one diagonal. Does it fold exactly in half, matching perfectly?",
            solution: [
              "A square has 4 equal sides and 4 right-angle corners.",
              "Folding along a diagonal creates two triangles that are mirror images of each other.",
              "Since the square's sides and angles are symmetric, the two triangles match exactly.",
              "Yes, a diagonal is a line of symmetry for a square.",
            ],
          },
        ],
        teachingSteps: [
          "Concrete: introduce the protractor, showing the two scales and practising lining up the base line and centre point correctly.",
          "Model: estimate an angle by eye first (is it more or less than a right angle?), then measure it with the protractor, comparing the two.",
          "Guided practice: measure 3-4 more angles together, always estimating first to catch wrong-scale reading errors.",
          "Concrete: fold a symmetrical shape in half to physically find its line of symmetry.",
          "Guided practice: identify lines of symmetry in 2-3 more shapes together, checking with folding where possible.",
          "Independent practice: have students measure 2 angles and identify the lines of symmetry in one figure on their own.",
          "Check understanding: give an angle close to 90 degrees on the 'wrong' scale side of the protractor to check students catch the scale-reading trap.",
        ],
      },
      {
        title: "Area and Perimeter of Composite Figures",
        strand: "Measurement and Geometry",
        description:
          "Finding the area and perimeter of figures made up of rectangles and squares combined. Teach students to physically draw a line splitting the composite figure into simple rectangles before calculating anything.",
        conceptExplanation:
          "A composite figure is a shape made up of two or more simple shapes (usually rectangles) joined together. To find its area, split the composite figure into simple rectangles using a straight line, calculate each rectangle's area separately using length × width, and add the results together. Finding the missing side lengths needed for this often requires using the measurements that ARE given, since the total length or width of the composite figure equals the sum of the corresponding smaller sides. For perimeter, only the actual OUTER boundary of the composite shape is measured — any internal line used just to split the shape for area is NOT part of the perimeter.",
        workedExamples: [
          {
            problem: "An L-shaped figure is split into a 6 cm × 4 cm rectangle and a separate 2 cm × 3 cm rectangle. Find the total area.",
            solution: [
              "Area of the first rectangle: 6 × 4 = 24 cm²",
              "Area of the second rectangle: 2 × 3 = 6 cm²",
              "Total area = 24 + 6 = 30 cm²",
            ],
          },
          {
            problem: "Why is an internal line used to split a composite figure not included when calculating its perimeter?",
            solution: [
              "Perimeter measures the distance around the OUTER boundary of a shape only.",
              "An internal split line is inside the shape, not part of its outer edge.",
              "Since perimeter only counts the outer edge, the internal line is excluded from the total.",
            ],
          },
        ],
        teachingSteps: [
          "Review: recap the P3 area and perimeter formulas for a single rectangle before introducing composite figures.",
          "Model: draw a line splitting a composite figure into two simple rectangles, labelling any missing side lengths using given measurements.",
          "Model: calculate the area of each simple rectangle separately, then add them for the total composite area.",
          "Guided practice: split and find the area of one more composite figure together.",
          "Model: for perimeter, trace around the actual outer edge of the composite shape (not the internal split line) to sum the perimeter.",
          "Independent practice: have students split, then find both area and perimeter of a new composite figure on their own.",
          "Check understanding: ask a student to explain why the internal split line is used for area but not counted in the perimeter.",
        ],
      },
      {
        title: "Data Analysis: Line Graphs and Pie Charts",
        strand: "Statistics",
        description:
          "Reading line graphs (showing change over time) and simple pie charts, plus nets of solids as a related visual-reasoning skill introduced at this level. Ask students to narrate the story a line graph is telling before extracting numbers from it.",
        conceptExplanation:
          "A line graph shows how a value changes over time by plotting points and connecting them with lines — the direction of the line (rising, falling, or flat) tells the 'story' of the change at a glance, before even reading exact numbers. A pie chart shows how a whole is divided into categories, using a circle where each slice's size represents its share of the whole — a bigger slice means a bigger proportion of the total. Nets of solids, also introduced here, show what a 3D solid looks like when 'unfolded' flat into its individual 2D faces, which helps build spatial reasoning for identifying and constructing 3D shapes.",
        workedExamples: [
          {
            problem: "A line graph shows a plant's height: 5 cm in Week 1, 5 cm in Week 2, 12 cm in Week 3. Describe what happened.",
            solution: [
              "From Week 1 to Week 2, the height stayed the same (5 cm to 5 cm) — the line would be flat.",
              "From Week 2 to Week 3, the height increased from 5 cm to 12 cm — the line would rise steeply.",
              "The plant did not grow in the first week, then grew quickly (by 7 cm) in the second week.",
            ],
          },
          {
            problem: "A pie chart shows a whole circle split into 4 equal slices, one labelled 'Football.' What fraction of the total does the Football slice represent?",
            solution: [
              "The whole circle represents the total (100%, or the whole 1).",
              "It is split into 4 equal slices.",
              "One slice out of 4 equal slices is 1/4 of the total.",
              "The Football slice represents 1/4 of the total.",
            ],
          },
        ],
        teachingSteps: [
          "Discuss: show a line graph and have a student narrate the 'story' it tells (rising, falling, staying flat) before reading any specific values.",
          "Guided practice: read specific values off the line graph together, then calculate a simple change between two points.",
          "Discuss: show a simple pie chart and identify what the whole circle represents and what each slice's size suggests.",
          "Guided practice: answer 1-2 comparison questions on the pie chart together (which slice is biggest, roughly what fraction is it).",
          "Concrete: fold a paper net into a solid, then unfold it, to introduce nets as a related spatial-reasoning skill.",
          "Independent practice: have students answer one line graph question and one pie chart question on their own.",
          "Check understanding: ask a student to describe what's happening between two points on the line graph in a full sentence, not just read off a single number.",
        ],
      },
    ],
  },
  {
    level: "P5",
    topics: [
      {
        title: "Whole Numbers and Number Patterns",
        diagram: {
          type: "number-line",
          min: 0,
          max: 30,
          step: 5,
          jumps: [
            { from: 5, to: 15, label: "+10", color: "green" },
            { from: 15, to: 25, label: "+10", color: "green" },
          ],
        },
        strand: "Number and Algebra",
        description:
          "Order of operations (including brackets) and identifying/extending number patterns. Order of operations needs explicit, repeated drilling — students default to left-to-right and skip the brackets/multiplication-first rules otherwise.",
        conceptExplanation:
          "Order of operations is the agreed set of rules for which calculation to do first when an expression has more than one operation, so that everyone gets the same answer: first calculate anything inside brackets, then do multiplication and division (left to right), and finally addition and subtraction (left to right). Without this agreed order, the same expression could be calculated in different ways and give different answers, which is why the rule matters. A number pattern is a sequence of numbers that follows a consistent rule (like 'add 4 each time' or 'multiply by 2 each time') — identifying the rule lets you predict what comes next, or even much further along the sequence, without having to write out every term.",
        workedExamples: [
          {
            problem: "Calculate: 3 + 4 × 2",
            solution: [
              "Following order of operations, do multiplication before addition.",
              "4 × 2 = 8",
              "3 + 8 = 11",
              "3 + 4 × 2 = 11 (not 14, which you'd get by wrongly calculating left to right).",
            ],
          },
          {
            problem: "Calculate: (3 + 4) × 2",
            solution: [
              "The brackets mean the addition inside must be done first, overriding the usual order.",
              "3 + 4 = 7",
              "7 × 2 = 14",
              "(3 + 4) × 2 = 14",
            ],
          },
        ],
        teachingSteps: [
          "Discuss: show one expression calculated two different ways (left-to-right vs. correct order) to make the point that order genuinely matters.",
          "Model: introduce the order-of-operations rule (brackets first, then multiplication/division, then addition/subtraction), applying it to one worked example.",
          "Guided practice: solve 3-4 more mixed-operation expressions together, narrating which operation is done first and why.",
          "Model: identify the rule behind a number pattern (e.g. add 4 each time, or multiply by 2), then extend it a few more terms.",
          "Independent practice: have students solve 2 order-of-operations expressions and extend one number pattern on their own.",
          "Check understanding: give an expression where skipping the bracket rule gives a very different (and wrong) answer, to explicitly test whether the rule has really been internalised.",
        ],
      },
      {
        title: "Four Operations on Fractions",
        diagram: { type: "fraction", numerator: 1, denominator: 4, compareNumerator: 2, compareDenominator: 4 },
        strand: "Number and Algebra",
        description:
          "Multiplying and dividing fractions (including by a whole number), building on P4's addition/subtraction of fractions. Fraction-of-a-quantity word problems (e.g. 2/5 of 40) are the main new problem type — model with a bar model before computing.",
        conceptExplanation:
          "Multiplying a fraction by a whole number can be thought of as repeated addition, just like whole-number multiplication — 3 × 1/4 means 1/4 added 3 times, giving 3/4. Dividing a fraction by a whole number means splitting that fraction into that many equal smaller parts — dividing 1/2 by 2 means splitting one half into two equal pieces, giving 1/4 each. A very common problem type is finding a 'fraction of a quantity' (like 2/5 of 40) — this means dividing the quantity by the denominator first (finding what one part is worth), then multiplying by the numerator (finding how many of those parts you need).",
        workedExamples: [
          {
            problem: "Find 2/5 of 40.",
            solution: [
              "Divide the quantity by the denominator to find the value of one part: 40 ÷ 5 = 8",
              "Multiply by the numerator to find the value of 2 parts: 8 × 2 = 16",
              "2/5 of 40 is 16.",
            ],
          },
          {
            problem: "3/4 ÷ 2 = ?",
            solution: [
              "Dividing a fraction by a whole number means splitting it into that many equal parts.",
              "This is the same as multiplying by 1 over that whole number: 3/4 × 1/2",
              "Multiply the numerators: 3 × 1 = 3. Multiply the denominators: 4 × 2 = 8",
              "3/4 ÷ 2 = 3/8",
            ],
          },
        ],
        teachingSteps: [
          "Review: recap P4's addition and subtraction of fractions with a quick warm-up question.",
          "Model: multiply a fraction by a whole number using repeated addition first, then the direct multiplication method.",
          "Model: divide a fraction by a whole number, connecting it conceptually to sharing a fraction into equal smaller parts.",
          "Guided practice: solve 2-3 more multiplication and division problems together.",
          "Model: for a 'fraction of a quantity' word problem (e.g. 2/5 of 40), draw a bar model split into 5 equal parts before calculating.",
          "Independent practice: have students solve one fraction-of-a-quantity word problem, requiring a bar model first.",
          "Check understanding: ask a student to explain, using the bar model, why 2/5 of 40 isn't simply 2 divided by 5 times 40 done in the wrong order.",
        ],
      },
      {
        title: "Decimals",
        strand: "Number and Algebra",
        description:
          "Multiplying and dividing decimals by whole numbers and by 10/100/1000, including rounding decimals to a given place. Rounding decimals trips students up when the digit to drop is a 9 — walk through several boundary cases explicitly.",
        conceptExplanation:
          "Multiplying or dividing a decimal by 10, 100, or 1000 shifts every digit's place value — multiplying by 10 moves each digit one place to the left (making the number 10 times bigger), while dividing by 10 moves each digit one place to the right (making it 10 times smaller). This is easiest to see as the decimal point appearing to 'shift' the corresponding number of places. Rounding decimals to a given number of decimal places follows the same landmark idea as rounding whole numbers, but a tricky case is when the digit being dropped is a 9 that rounds up — this can cause the rounding to 'carry over' into the next digit, or even the next whole number.",
        workedExamples: [
          {
            problem: "3.45 × 100 = ?",
            solution: [
              "Multiplying by 100 shifts every digit two places to the left (equivalent to moving the decimal point two places right).",
              "3.45 becomes 345.",
              "3.45 × 100 = 345",
            ],
          },
          {
            problem: "Round 2.996 to 2 decimal places.",
            solution: [
              "Look at the third decimal place (the thousandths digit) to decide rounding: it is 6.",
              "Since 6 is 5 or more, round the second decimal place up: the hundredths digit 9 becomes 10, which carries over.",
              "This carry cascades: 2.99 rounded up becomes 3.00.",
              "2.996 rounded to 2 decimal places is 3.00.",
            ],
          },
        ],
        teachingSteps: [
          "Review: recap decimal place value from P4 before introducing new operations.",
          "Model: multiply and divide a decimal by 10, 100 and 1000, showing the digits physically shifting on a place-value chart.",
          "Guided practice: solve 2-3 more multiply/divide-by-power-of-10 problems together.",
          "Model: multiply a decimal by a whole number using the standard algorithm, placing the decimal point correctly at the end.",
          "Model: round a decimal to a given place, deliberately choosing a boundary case (a 9 that rounds up and carries over) to show it explicitly.",
          "Independent practice: have students solve one decimal calculation and one rounding boundary case on their own.",
          "Check understanding: give a decimal like 2.996 to round to 2 decimal places, specifically to test the carrying-over edge case.",
        ],
      },
      {
        title: "Percentage",
        strand: "Number and Algebra",
        description:
          "Introduces percentage as 'per hundred', converting between fractions/decimals/percentages, and finding a percentage of a quantity. Connect percentage explicitly to the fractions and decimals already learned rather than teaching it as an isolated new idea.",
        conceptExplanation:
          "Percentage means 'out of 100' — 25% means 25 out of every 100, which is the same amount as the fraction 25/100 or the decimal 0.25. Because fractions, decimals and percentages all describe the same part-whole relationship, any value can be converted between the three forms. To find a percentage of a quantity (like 20% of 50), convert the percentage to a fraction or decimal first (20% = 20/100 = 1/5), then apply it to the quantity the same way you would find a fraction of a quantity.",
        workedExamples: [
          {
            problem: "Convert 3/4 to a percentage.",
            solution: [
              "Convert the fraction to an equivalent fraction with a denominator of 100: 3/4 = 75/100 (multiply both top and bottom by 25).",
              "75/100 means 75 out of 100, which is 75%.",
              "3/4 = 75%",
            ],
          },
          {
            problem: "Find 20% of 50.",
            solution: [
              "Convert 20% to a fraction: 20% = 20/100 = 1/5",
              "Find 1/5 of 50: 50 ÷ 5 = 10",
              "20% of 50 is 10.",
            ],
          },
        ],
        teachingSteps: [
          "Discuss: introduce percentage as 'out of 100,' using a 100-square grid shaded to a given percentage, connecting it visually to the hundredths already learned in decimals.",
          "Model: convert between a fraction, a decimal and a percentage for the same value, showing all three represent the same amount.",
          "Guided practice: convert 3-4 more values between the three forms together.",
          "Model: find a percentage of a quantity (e.g. 20% of 50) using the fraction-of-a-quantity method already learned.",
          "Independent practice: have students convert one value between forms and find a percentage of a quantity on their own.",
          "Check understanding: ask a student to explain, without calculating, whether 25% of a number is bigger or smaller than 1/2 of it, to check the fraction-percentage link is genuinely understood.",
        ],
      },
      {
        title: "Rate",
        strand: "Number and Algebra",
        description:
          "A new topic: solving problems involving rate (e.g. cost per kg, output per hour) as a quantity that relates two different units. The bar model is especially useful here to show the per-unit relationship before scaling it up or down.",
        conceptExplanation:
          "A rate describes how one quantity relates to another different quantity — for example, a cost of $3 per kg tells you the price for every 1 kg, and a printer's output of 20 pages per minute tells you how many pages it produces every 1 minute. Solving rate problems usually starts by finding the 'per unit' value (the value for just 1 of something), and then scaling that value up or down to find the answer for a different amount. This is why rate problems are sometimes solved using the unitary method — deliberately working out what ONE unit is worth as the very first step.",
        workedExamples: [
          {
            problem: "Apples cost $6 for 3 kg. How much do 5 kg of apples cost?",
            solution: [
              "Find the cost per 1 kg (the unit rate): $6 ÷ 3 kg = $2 per kg",
              "Multiply the unit rate by the new quantity: $2 × 5 kg",
              "5 kg of apples cost $10.",
            ],
          },
          {
            problem: "A machine produces 120 toys in 4 hours, at a constant rate. How many toys does it produce in 7 hours?",
            solution: [
              "Find the rate per 1 hour: 120 ÷ 4 = 30 toys per hour",
              "Multiply by the new number of hours: 30 × 7 = 210",
              "The machine produces 210 toys in 7 hours.",
            ],
          },
        ],
        teachingSteps: [
          "Discuss: introduce rate with a concrete example (cost per kg at a market) and ask what 'per kg' actually means.",
          "Model: draw a bar model showing one unit's rate, then scale the bar up to find the total for several units.",
          "Guided practice: solve 2-3 more rate problems together, always starting from the per-unit bar model.",
          "Model: solve a reverse rate problem (given the total, find the rate, or given the total and rate, find the number of units).",
          "Independent practice: have students solve one forward and one reverse rate problem on their own.",
          "Check understanding: ask a student to state, in a full sentence, what the rate in a given problem actually means in real-world terms, not just compute a number.",
        ],
      },
      {
        title: "Volume of Cubes and Cuboids",
        strand: "Measurement and Geometry",
        description:
          "Finding the volume of cubes and cuboids using the formula length × width × height, and relating volume to capacity in litres. Building physical unit cubes into a cuboid first helps the formula feel derived rather than memorised.",
        conceptExplanation:
          "Volume measures how much space a 3D solid takes up, measured in cubic units (like cm³). For a cuboid, volume is found using the formula length × width × height, which comes from thinking of the cuboid as being built from layers of unit cubes — each layer has (length × width) cubes, and there are (height) layers, so multiplying all three together counts every cube. A cube is a special cuboid where the length, width and height are all equal. Volume in cubic units connects to capacity in litres — 1000 cm³ of space holds exactly 1 litre of liquid.",
        workedExamples: [
          {
            problem: "Find the volume of a cuboid with length 5 cm, width 3 cm, and height 4 cm.",
            solution: ["Volume = length × width × height", "Volume = 5 × 3 × 4", "5 × 3 = 15, then 15 × 4 = 60", "The volume is 60 cm³."],
          },
          {
            problem: "A cuboid has a volume of 120 cm³. Its length is 6 cm and its width is 5 cm. Find its height.",
            solution: [
              "Volume = length × width × height, so height = volume ÷ (length × width)",
              "length × width = 6 × 5 = 30",
              "height = 120 ÷ 30",
              "The height is 4 cm.",
            ],
          },
        ],
        teachingSteps: [
          "Concrete: build a simple cuboid out of unit cubes and count the total by layers (length × width per layer, then × height for layers).",
          "Discuss: derive the formula length × width × height directly from the layer-counting method just done, so it isn't just handed down.",
          "Guided practice: find the volume of 2-3 more cuboids using the formula, checking against physical or drawn cube-counting for one of them.",
          "Discuss: connect volume in cubic units to capacity in litres using a real 1-litre container's dimensions as an example.",
          "Independent practice: have students find the volume of a cuboid and relate it to a capacity question on their own.",
          "Check understanding: give the volume and two of the three dimensions, and ask a student to find the missing dimension, to check the formula is understood as a relationship, not a one-way calculation.",
        ],
      },
      {
        title: "Area of Triangles",
        strand: "Measurement and Geometry",
        description:
          "Finding the area of a triangle using half of base × height, including identifying the correct base-height pair in triangles that aren't drawn with a horizontal base. Physically cutting a rectangle into two triangles is a strong way to derive the formula.",
        conceptExplanation:
          "The area of a triangle is found using the formula half of base × height, which comes from the fact that any triangle is exactly half of a rectangle (or parallelogram) with the same base and height — this can be shown by cutting a rectangle along its diagonal to produce two identical triangles. The 'height' in this formula always means the PERPENDICULAR distance from the base to the opposite corner (vertex), measured at a right angle to the base — not the length of one of the triangle's slanted sides. This matters especially for triangles that aren't drawn with a flat horizontal base, where it's easy to mistakenly use a slanted side as the height instead of the true perpendicular measurement.",
        workedExamples: [
          {
            problem: "A triangle has a base of 8 cm and a height of 5 cm. Find its area.",
            solution: ["Area of a triangle = 1/2 × base × height", "Area = 1/2 × 8 × 5", "8 × 5 = 40, then 1/2 × 40 = 20", "The area is 20 cm²."],
          },
          {
            problem: "A triangle has an area of 30 cm² and a base of 12 cm. Find its height.",
            solution: [
              "Area = 1/2 × base × height, so height = (2 × area) ÷ base",
              "2 × 30 = 60",
              "height = 60 ÷ 12",
              "The height is 5 cm.",
            ],
          },
        ],
        teachingSteps: [
          "Concrete: cut a rectangle along its diagonal to produce two identical triangles, showing each triangle is exactly half the rectangle's area.",
          "Discuss: derive the formula (half of base × height) directly from this rectangle-halving demonstration.",
          "Model: find the area of a triangle drawn with a clear horizontal base and vertical height first.",
          "Model: find the area of a triangle NOT drawn with a horizontal base, explicitly identifying which side is the base and which line is the perpendicular height.",
          "Guided practice: find the area of 2-3 more triangles in different orientations together.",
          "Independent practice: have students find the area of one 'awkwardly oriented' triangle on their own.",
          "Check understanding: give a triangle with an extra, irrelevant side length marked, and check the student picks the correct base-height pair rather than any two given numbers.",
        ],
      },
    ],
  },
  {
    level: "P6",
    topics: [
      {
        title: "Algebra: Expressions and Simple Equations",
        strand: "Number and Algebra",
        description:
          "New for the current syllabus: writing and simplifying simple algebraic expressions and solving one-step equations. Frame a letter as an unknown number in a bar model rather than an abstract symbol — students already have years of bar-model practice to lean on.",
        conceptExplanation:
          "In algebra, a letter (like n or x) stands for an unknown or changing number — the same idea as the unlabelled 'part' in a bar model used for word problems in earlier levels. An algebraic expression combines letters and numbers using operations (like n + 5, or 3n), and simplifying an expression means combining 'like terms' (terms with the same letter) to write it more simply, such as 2n + 3n = 5n. A simple equation states that an expression equals a specific value (like n + 5 = 12), and solving it means finding the value of the unknown letter that makes the equation true — this is the same 'find the missing part' reasoning already used in primary word problems, just written with algebraic notation instead of a bar model.",
        workedExamples: [
          {
            problem: "Write an algebraic expression for '7 more than a number n.'",
            solution: [
              "'A number n' is the starting unknown quantity.",
              "'7 more than' means adding 7 to that quantity.",
              "The expression is n + 7.",
            ],
          },
          {
            problem: "Solve: n + 5 = 12",
            solution: [
              "The equation says an unknown number, plus 5, equals 12.",
              "To find n, undo the '+5' by subtracting 5 from both sides.",
              "n + 5 - 5 = 12 - 5",
              "n = 7",
            ],
          },
        ],
        teachingSteps: [
          "Discuss: introduce a letter as simply standing for an unknown number, drawing it as an unlabelled bar-model part, just like an unknown quantity in earlier word problems.",
          "Model: write a simple algebraic expression from a word description (e.g. '5 more than a number' becomes n + 5).",
          "Guided practice: write 3-4 more expressions from word descriptions together.",
          "Model: simplify an expression by collecting like terms, using the bar model to justify why terms can be combined.",
          "Model: solve a one-step equation by relating it back to the same bar-model 'missing part' reasoning used in primary word problems.",
          "Independent practice: have students write one expression and solve one one-step equation on their own.",
          "Check understanding: ask a student to explain what the letter in their equation actually represents in the original word problem, to confirm it isn't just abstract symbol-pushing.",
        ],
      },
      {
        title: "Ratio",
        strand: "Number and Algebra",
        description:
          "Expressing and simplifying ratios, and solving word problems involving ratio (including ratios of three quantities). Moved to P6 in the current syllabus — connect it explicitly to the equivalent-fraction work from P3/P4, since ratio simplification uses the same idea.",
        conceptExplanation:
          "A ratio compares two or more quantities, showing how many times bigger one is than another — a ratio of 2:3 means for every 2 units of the first quantity, there are 3 units of the second. Simplifying a ratio works exactly like simplifying a fraction: divide all the numbers in the ratio by their common factor until they can't be simplified further (2:3 is already in simplest form, but 4:6 simplifies to 2:3 by dividing both by 2). Solving a ratio word problem often means splitting a total into equal 'parts' based on the ratio, finding the value of one part first, then multiplying to find each share — the same unitary approach used in rate problems.",
        workedExamples: [
          {
            problem: "Simplify the ratio 12:18.",
            solution: [
              "Find the highest common factor of 12 and 18, which is 6.",
              "Divide both numbers by 6: 12 ÷ 6 = 2, and 18 ÷ 6 = 3",
              "12:18 simplified is 2:3.",
            ],
          },
          {
            problem: "$60 is shared between Ali and Ben in the ratio 2:3. How much does each person get?",
            solution: [
              "The ratio 2:3 means the total is split into 2 + 3 = 5 equal parts.",
              "Find the value of 1 part: $60 ÷ 5 = $12",
              "Ali gets 2 parts: 2 × $12 = $24",
              "Ben gets 3 parts: 3 × $12 = $36",
              "Ali gets $24 and Ben gets $36 (check: $24 + $36 = $60).",
            ],
          },
        ],
        teachingSteps: [
          "Review: recap simplifying equivalent fractions from P3/P4, then show that simplifying a ratio uses exactly the same idea.",
          "Model: express a real comparison (e.g. 6 red counters to 4 blue counters) as a ratio and simplify it.",
          "Guided practice: simplify 3-4 more ratios together, including some with three quantities.",
          "Model: solve a ratio word problem using a bar model, splitting the total into the ratio's equal parts.",
          "Guided practice: solve one more ratio word problem, this time with three quantities in the ratio.",
          "Independent practice: have students solve one ratio word problem on their own, drawing the bar model first.",
          "Check understanding: ask a student to explain why a ratio of 2:3 and 4:6 represent the same comparison, tying it back explicitly to equivalent fractions.",
        ],
      },
      {
        title: "Average",
        strand: "Number and Algebra",
        description:
          "Finding the average of a set of numbers and solving problems where the average, total or number of items must be worked backward. 'Total = average × number of items' is the one relationship worth over-drilling, since almost every question reduces to it.",
        conceptExplanation:
          "The average of a set of numbers represents what each number would be if the total was shared out equally among all of them — like levelling out unequal stacks of blocks until every stack has the same height. It is calculated using the relationship: average = total ÷ number of items, which can be rearranged to find the total if the average and number of items are known: total = average × number of items. This 'total = average × number of items' relationship is the key to solving almost every average problem, including trickier ones that work backward from the average to find a missing value or a new total.",
        workedExamples: [
          {
            problem: "Find the average of 12, 18, and 15.",
            solution: ["Find the total: 12 + 18 + 15 = 45", "Divide by the number of items: 45 ÷ 3", "The average is 15."],
          },
          {
            problem: "The average of 4 numbers is 20. If three of the numbers are 15, 22, and 18, find the fourth number.",
            solution: [
              "Use total = average × number of items: total = 20 × 4 = 80",
              "Add the three known numbers: 15 + 22 + 18 = 55",
              "The fourth number = total - sum of known numbers = 80 - 55",
              "The fourth number is 25.",
            ],
          },
        ],
        teachingSteps: [
          "Concrete: physically redistribute unequal stacks of counters into equal stacks to show what 'average' actually means (levelling out).",
          "Model: calculate an average by finding the total and dividing by the number of items, stating the total = average × number of items relationship explicitly.",
          "Guided practice: calculate 2-3 more averages together, always stating the relationship out loud before dividing.",
          "Model: solve a 'work backward' problem where the average and number of items are given but the total (or a missing value) must be found.",
          "Independent practice: have students solve one forward (find the average) and one backward (find a missing value) problem.",
          "Check understanding: give a problem with a new item that changes the average, and ask the student to find the new item's value — this specifically tests whether the total = average × count relationship is truly internalised.",
        ],
      },
      {
        title: "Percentage and Fraction Word Problems",
        strand: "Number and Algebra",
        description:
          "Multi-step word problems combining percentage, fraction and ratio in a single question — the PSLE's classic heuristics problem type. Bar models remain the most reliable tool; resist the urge to jump straight to algebra even though P6 now teaches it.",
        conceptExplanation:
          "This topic combines percentage, fraction, and ratio skills into multi-step word problems, which is the classic style of 'heuristics' question tested at PSLE. Since these problems have several steps and pieces of information, a bar model is the most reliable way to organise the information visually before calculating — even at P6 where algebra is now available, many multi-step problems remain faster and less error-prone to solve with a well-built bar model. The key skill is breaking the problem into smaller steps, solving each one in order, and using the result of one step as the input to the next.",
        workedExamples: [
          {
            problem: "Sarah has $80. She spends 25% of it on a book, then spends 2/5 of what remains on a bag. How much money does she have left?",
            solution: [
              "Find 25% of $80 spent on the book: 25% × 80 = $20",
              "Money remaining after the book: 80 - 20 = $60",
              "Find 2/5 of $60 spent on the bag: 2/5 × 60 = $24",
              "Money remaining after the bag: 60 - 24 = $36",
              "Sarah has $36 left.",
            ],
          },
          {
            problem: "A shop has 200 shirts. 40% are sold on Monday. Of the remaining shirts, 1/3 are sold on Tuesday. How many shirts are left?",
            solution: [
              "Find 40% of 200 sold on Monday: 40% × 200 = 80 shirts",
              "Shirts remaining after Monday: 200 - 80 = 120",
              "Find 1/3 of 120 sold on Tuesday: 120 ÷ 3 = 40 shirts",
              "Shirts remaining after Tuesday: 120 - 40 = 80",
              "There are 80 shirts left.",
            ],
          },
        ],
        teachingSteps: [
          "Review: quickly recap that fractions, decimals, percentages and ratios all describe the same kind of part-whole relationship.",
          "Model: work through one multi-step word problem combining two of these ideas (e.g. percentage then ratio), building the bar model step by step as new information is revealed.",
          "Discuss: explicitly note where the bar model made an otherwise confusing multi-step problem manageable, reinforcing it as the default tool over jumping straight to algebra.",
          "Guided practice: solve one more multi-step problem together, this time having the student lead the bar-model construction.",
          "Independent practice: have students solve one multi-step problem combining at least two of percentage/fraction/ratio on their own.",
          "Check understanding: ask a student to identify, before solving, which pieces of information in the problem they'll need for the bar model and which are just context.",
        ],
      },
      {
        title: "Angles and Properties of Shapes",
        strand: "Measurement and Geometry",
        description:
          "Angle properties of triangles, quadrilaterals and other polygons, including angles on a straight line and around a point. Keep a running reference sheet of angle facts (sums to 180°, 360°, etc.) — most errors are forgetting a rule, not misapplying it.",
        conceptExplanation:
          "This topic brings together several angle facts learned across primary school into a single toolkit: angles on a straight line add up to 180°, angles around a point add up to 360°, and the angles inside a triangle always add up to 180°. These facts extend to other shapes too — a quadrilateral's angles always add up to 360° (since it can be split into two triangles). Solving an angle problem means identifying which of these facts applies to the diagram given, often using more than one fact in sequence to work toward the unknown angle.",
        workedExamples: [
          {
            problem: "A triangle has two angles of 50° and 70°. Find the third angle.",
            solution: [
              "The angles in a triangle always add up to 180°.",
              "Add the two known angles: 50 + 70 = 120",
              "The third angle = 180 - 120",
              "The third angle is 60°.",
            ],
          },
          {
            problem: "Two angles lie on a straight line. One is 65°. Find the other.",
            solution: ["Angles on a straight line add up to 180°.", "The other angle = 180 - 65", "The other angle is 115°."],
          },
        ],
        teachingSteps: [
          "Review: build a running reference sheet of angle facts as they're used (angles on a line = 180°, around a point = 360°, in a triangle = 180°).",
          "Concrete: tear the three corners off a paper triangle and arrange them along a straight line to physically show they sum to 180°.",
          "Model: find a missing angle in a triangle using the reference sheet, narrating which fact is being applied.",
          "Guided practice: find missing angles in 2-3 more triangle and quadrilateral problems together, always checking the reference sheet first.",
          "Independent practice: have students find missing angles in one multi-step problem combining more than one angle fact.",
          "Check understanding: give a problem and ask the student to name which specific angle fact from the reference sheet justifies each step of their working.",
        ],
      },
      {
        title: "Volume and Nets of Solids",
        strand: "Measurement and Geometry",
        description:
          "Finding the volume of composite solids built from cubes/cuboids, and relating a solid to its net. Physically folding a paper net into a solid (and unfolding it again) builds spatial reasoning that a flat worksheet can't.",
        conceptExplanation:
          "A composite solid is built from two or more simple solids (like cuboids) joined together — finding its total volume means splitting it into simple solids, finding each one's volume using length × width × height, and adding the results together, the same splitting strategy used for the area of composite 2D figures. A net is what a 3D solid looks like when all its faces are unfolded and laid out flat — every solid can be represented by more than one possible net arrangement, as long as the faces are correctly connected to fold back into a closed solid with no gaps or overlaps.",
        workedExamples: [
          {
            problem: "A composite solid is made of a 4 cm × 3 cm × 2 cm cuboid stacked on top of a 4 cm × 3 cm × 5 cm cuboid. Find the total volume.",
            solution: [
              "Volume of the top cuboid: 4 × 3 × 2 = 24 cm³",
              "Volume of the bottom cuboid: 4 × 3 × 5 = 60 cm³",
              "Total volume = 24 + 60 = 84 cm³",
            ],
          },
          {
            problem: "A cube's net is made of 6 identical squares. If each square has a side length of 3 cm, what is the cube's volume?",
            solution: [
              "Each face of the cube is a square with side 3 cm, so the cube's length, width and height are all 3 cm.",
              "Volume = length × width × height = 3 × 3 × 3",
              "The cube's volume is 27 cm³.",
            ],
          },
        ],
        teachingSteps: [
          "Concrete: fold a paper net into a cuboid, then unfold it flat again, discussing which faces match up.",
          "Review: recap the P5 volume formula for a single cuboid before combining solids.",
          "Model: split a composite solid into two simple cuboids, find each volume separately, and add them together.",
          "Guided practice: split and find the volume of one more composite solid together.",
          "Guided practice: match 2-3 more nets to their correct solids, checking with physical folding where needed.",
          "Independent practice: have students find the volume of a composite solid and match one net to its solid on their own.",
          "Check understanding: show an almost-correct net (with one face in the wrong position) and ask a student to explain why it wouldn't fold into a closed solid.",
        ],
      },
      {
        title: "Data Analysis: Pie Charts",
        strand: "Statistics",
        description:
          "Interpreting pie charts, including converting between percentages/fractions of a whole and actual quantities. This draws directly on the percentage and ratio work earlier in P6 — treat it as an application, not a brand-new skill.",
        conceptExplanation:
          "A pie chart represents a whole amount as a full circle (100%), divided into slices where each slice's size shows its share of the whole. This topic applies percentage and ratio skills directly: if a slice represents a given percentage and the total quantity is known, that slice's actual quantity can be found by calculating that percentage of the total — and working backward, if a slice's actual quantity and percentage are both known, the whole total can be found. A useful check is that all the percentages of the slices in a pie chart must always add up to exactly 100%.",
        workedExamples: [
          {
            problem: "A pie chart shows a school's 400 students split by favourite sport. The 'Football' slice is 35% of the chart. How many students chose football?",
            solution: [
              "The slice represents 35% of the total 400 students.",
              "Find 35% of 400: 35% × 400 = 140",
              "140 students chose football.",
            ],
          },
          {
            problem: "In a pie chart, the 'Basketball' slice represents 60 students, which is 15% of the total. Find the total number of students.",
            solution: [
              "60 students represents 15% of the total.",
              "Find 1% of the total: 60 ÷ 15 = 4 students per 1%",
              "Find 100% (the total): 4 × 100 = 400",
              "The total number of students is 400.",
            ],
          },
        ],
        teachingSteps: [
          "Review: recap that a pie chart's whole circle represents 100%, connecting directly back to the percentage work already done this term.",
          "Model: given the total and one slice's percentage, calculate that slice's actual quantity.",
          "Guided practice: calculate 2-3 more slice quantities from percentages together.",
          "Model: work backward — given one slice's actual quantity and its percentage, find the whole total.",
          "Independent practice: have students solve one forward and one backward pie-chart calculation on their own.",
          "Check understanding: ask a student to check that all the slice percentages in a chart sum to 100%, as a self-verification habit.",
        ],
      },
      {
        title: "Probability Basics",
        strand: "Statistics",
        description:
          "An introductory look at describing the likelihood of an event using everyday language and simple fractions. Keep this light and intuitive (dice, coins, spinners) — it's a foundation for the formal probability topic that returns properly in secondary school.",
        conceptExplanation:
          "Probability describes how likely an event is to happen, ranging from 'impossible' (will never happen) through 'unlikely,' 'even chance,' 'likely,' up to 'certain' (will always happen). At this introductory level, probability can also be expressed as a simple fraction: the number of favourable outcomes (the ones you're interested in) divided by the total number of equally possible outcomes. For example, rolling a fair die has 6 equally possible outcomes, so the probability of rolling any specific number (like a 6) is 1 out of those 6 possibilities.",
        workedExamples: [
          {
            problem: "A bag has 3 red balls and 2 blue balls. What is the probability of picking a red ball, as a fraction?",
            solution: [
              "Count the total number of balls (total possible outcomes): 3 + 2 = 5",
              "Count the favourable outcomes (red balls): 3",
              "Probability = favourable outcomes ÷ total outcomes = 3/5",
            ],
          },
          {
            problem: "A fair six-sided die is rolled once. What is the probability of rolling an even number?",
            solution: [
              "The total possible outcomes are 1, 2, 3, 4, 5, 6 — that's 6 outcomes.",
              "The even numbers among these are 2, 4, 6 — that's 3 favourable outcomes.",
              "Probability = 3/6, which simplifies to 1/2.",
            ],
          },
        ],
        teachingSteps: [
          "Concrete: flip a coin or roll a die several times, recording outcomes, and discuss whether the results felt 'certain,' 'likely,' 'unlikely' or 'impossible.'",
          "Discuss: introduce the everyday-language likelihood scale (impossible, unlikely, even chance, likely, certain) and place a few example events on it together.",
          "Model: express one simple probability as a fraction (e.g. probability of rolling a 6 is 1/6), connecting the fraction to counting favourable outcomes over total outcomes.",
          "Guided practice: express 2-3 more simple probabilities as fractions together, using a spinner or die.",
          "Independent practice: have students place 2 new events on the likelihood scale and express one as a simple fraction.",
          "Check understanding: ask a student why a probability can never be described as more than 'certain' or less than 'impossible,' to build early intuition for the 0-to-1 boundary formalised later in secondary school.",
        ],
      },
    ],
  },
  {
    level: "SEC1",
    topics: [
      {
        title: "Directed Numbers and Real Number Operations",
        diagram: {
          type: "number-line",
          min: -10,
          max: 10,
          step: 2,
          jumps: [{ from: -3, to: 4, label: "+7", color: "green" }],
        },
        strand: "Number and Algebra",
        description:
          "The four operations on negative numbers and integers, extending the whole-number system students already know. A number line is essential here — most errors come from a shaky mental model of what subtracting a negative actually means.",
        conceptExplanation:
          "Directed numbers are numbers that include negative values (below zero) as well as positive values, extending the number system students already know. On a number line, positive numbers extend to the right of zero and negative numbers to the left — adding a number moves you to the right, and subtracting moves you to the left. The trickiest idea is that subtracting a negative number is the same as adding a positive number (moving right), because 'taking away a debt' leaves you better off — for example, 5 - (-3) = 5 + 3 = 8.",
        workedExamples: [
          {
            problem: "Calculate: -3 + 7",
            solution: ["Start at -3 on the number line.", "Adding 7 means moving 7 steps to the right.", "-3 + 7 = 4"],
          },
          {
            problem: "Calculate: 5 - (-3)",
            solution: [
              "Subtracting a negative number is the same as adding its positive value.",
              "5 - (-3) = 5 + 3",
              "5 - (-3) = 8",
            ],
          },
        ],
        teachingSteps: [
          "Activate prior knowledge: review adding and subtracting whole numbers on a number line before introducing negative numbers.",
          "Introduce: extend the number line to the left of zero, having students locate and order a few negative numbers on it.",
          "Worked example: add and subtract with negative numbers by physically moving along the number line, narrating each direction change.",
          "Worked example 2: show subtracting a negative number as equivalent to moving in the opposite direction, using a second number-line example to make the rule concrete rather than just stated.",
          "Guided practice: work through 3-4 mixed directed-number problems together as a class.",
          "Independent practice: have students solve a short set of directed-number problems on their own.",
          "Check for understanding: give one subtract-a-negative problem and ask the student to explain their reasoning using the number line, not just state the rule from memory.",
        ],
      },
      {
        title: "Approximation and Estimation",
        strand: "Number and Algebra",
        description:
          "Rounding to a given number of significant figures or decimal places, and estimating calculations to check reasonableness. Make estimation a habit before every calculation, not an afterthought — it catches a huge share of careless errors.",
        conceptExplanation:
          "Significant figures are a way of rounding a number that keeps track of how precisely it's known, counting from the first non-zero digit — for example, 0.00456 has 3 significant figures (4, 5, 6), since the leading zeros just show place value and aren't 'significant.' Estimation means quickly finding an approximate answer, usually by rounding each number in a calculation to 1 significant figure first, so the calculation becomes simple enough to do in your head. Estimating BEFORE doing an exact calculation is a valuable habit because it gives a sanity check — if the exact answer is wildly different from the estimate, there's likely been a careless error.",
        workedExamples: [
          {
            problem: "Round 4,872 to 2 significant figures.",
            solution: [
              "The first significant figure is 4 (thousands), the second is 8 (hundreds).",
              "Look at the next digit (7) to decide rounding: since 7 ≥ 5, round the second significant figure up.",
              "8 rounds up to 9, giving 4,900 (the remaining digits become zeros to keep the place value correct).",
              "4,872 rounded to 2 significant figures is 4,900.",
            ],
          },
          {
            problem: "Estimate the answer to 396 × 5.2 by rounding each number to 1 significant figure.",
            solution: [
              "Round 396 to 1 significant figure: 400",
              "Round 5.2 to 1 significant figure: 5",
              "Estimate: 400 × 5 = 2000",
              "The estimated answer is approximately 2000 (the exact answer, 2059.2, is reasonably close, confirming no major error).",
            ],
          },
        ],
        teachingSteps: [
          "Activate prior knowledge: recap decimal-place rounding from primary school as a starting point.",
          "Introduce: explain significant figures, identifying the first significant figure in a few example numbers together.",
          "Worked example: round a number to a given number of significant figures, narrating which digits count and which get replaced with zeros.",
          "Worked example 2: estimate the answer to a calculation by rounding each number to 1 significant figure first, then compare to the exact answer.",
          "Guided practice: round 2-3 more numbers to significant figures, and estimate 2 more calculations together.",
          "Independent practice: have students round a set of numbers and estimate one calculation before solving it exactly.",
          "Check for understanding: give a calculation where a careless slip produces an answer wildly different from the estimate, and have the student use the estimate to catch the error.",
        ],
      },
      {
        title: "Algebraic Expressions and Simplification",
        strand: "Number and Algebra",
        description:
          "Expanding brackets, collecting like terms, and simplifying expressions with multiple variables — the first real jump in abstraction from primary algebra. Substituting numbers into an expression before and after simplifying is a good way to build trust that the simplification is valid.",
        conceptExplanation:
          "Expanding brackets means multiplying every term inside the bracket by the term outside it — for example, 2(x + 3) means multiplying both x and 3 by 2, giving 2x + 6. Like terms are terms that contain the exact same letter(s) raised to the same power (like 3x and 5x, or 2y² and 7y²) — these can be combined by adding or subtracting their numerical coefficients, while unlike terms (like 3x and 5y) cannot be combined. Substituting a specific number for the letter, before and after simplifying an expression, is a reliable way to check that a simplification is correct — both versions must give the same result.",
        workedExamples: [
          {
            problem: "Expand: 3(2x + 5)",
            solution: ["Multiply each term inside the bracket by 3.", "3 × 2x = 6x", "3 × 5 = 15", "3(2x + 5) = 6x + 15"],
          },
          {
            problem: "Simplify: 4x + 3y - x + 2y",
            solution: [
              "Group the like terms together: (4x - x) + (3y + 2y)",
              "Combine the x terms: 4x - x = 3x",
              "Combine the y terms: 3y + 2y = 5y",
              "4x + 3y - x + 2y = 3x + 5y",
            ],
          },
        ],
        teachingSteps: [
          "Activate prior knowledge: recap the P6 idea of a letter standing for an unknown number.",
          "Worked example: expand a simple bracket (e.g. 2(x + 3)) using the area-model or distributive picture, then abstractly.",
          "Worked example 2: collect like terms in an expression with multiple variables, sorting terms by type before combining.",
          "Verify: substitute a chosen number into the original and the simplified expression, showing both give the same value, to build trust in the simplification.",
          "Guided practice: expand and simplify 2-3 more expressions together.",
          "Independent practice: have students simplify a short set of expressions on their own, checking one with substitution.",
          "Check for understanding: give an expression with a common sign error (e.g. distributing a negative incorrectly) and have the student spot and fix it.",
        ],
      },
      {
        title: "Linear Equations in One Variable",
        strand: "Number and Algebra",
        description:
          "Solving linear equations, including ones requiring expansion of brackets first, and forming equations from word problems. Insist on writing every step (not skipping to the answer) — it's what makes errors visible and fixable.",
        conceptExplanation:
          "A linear equation states that an algebraic expression equals a specific value, and solving it means finding the value of the unknown that makes the equation true. The key rule for solving is that whatever operation is done to one side of the equation must also be done to the other side, to keep the equation balanced — this lets you gradually 'undo' the operations around the unknown until it's isolated alone on one side. When brackets are involved, they're usually expanded first before the rest of the equation is solved, connecting directly to the expansion skill from the previous topic.",
        workedExamples: [
          {
            problem: "Solve: 3x + 5 = 20",
            solution: [
              "Subtract 5 from both sides to undo the '+5': 3x + 5 - 5 = 20 - 5",
              "3x = 15",
              "Divide both sides by 3 to undo the multiplication: x = 15 ÷ 3",
              "x = 5",
            ],
          },
          {
            problem: "Solve: 2(x + 3) = 16",
            solution: [
              "Expand the bracket first: 2x + 6 = 16",
              "Subtract 6 from both sides: 2x = 10",
              "Divide both sides by 2: x = 5",
            ],
          },
        ],
        teachingSteps: [
          "Activate prior knowledge: recap the P6 idea of solving a one-step equation via the bar-model 'missing part' reasoning.",
          "Worked example: solve a two-step linear equation, writing every step (what was done to both sides) explicitly.",
          "Worked example 2: solve an equation requiring bracket expansion first, connecting back to the simplification topic just covered.",
          "Guided practice: solve 3-4 more equations together, insisting every step is written down, not skipped.",
          "Worked example 3: form an equation from a word problem, defining the unknown clearly before writing the equation.",
          "Independent practice: have students solve 2 equations and form-and-solve one equation from a word problem.",
          "Check for understanding: have a student check their solution by substituting it back into the original equation.",
        ],
      },
      {
        title: "Number Patterns and Sequences",
        strand: "Number and Algebra",
        description:
          "Describing and continuing number patterns, and finding a general (algebraic) term for a sequence. This is where the P6 introduction to algebra pays off directly — frame the general term as the pattern's rule written as an expression.",
        conceptExplanation:
          "A sequence is a list of numbers following a pattern, and the 'general term' is an algebraic expression that describes any term in the sequence based on its position — for example, the sequence 4, 7, 10, 13... increases by 3 each time, and its general term is 3n + 1 (where n is the position number). Finding a general term usually starts by describing the pattern in words (like 'multiply the position by 3, then add 1'), and then translating that word description directly into algebraic notation. Once a general term is known, it can be used to find any term in the sequence instantly — even a very distant one, like the 100th term — without having to list out every term before it.",
        workedExamples: [
          {
            problem: "Find the general term (nth term) of the sequence 5, 9, 13, 17...",
            solution: [
              "Find the common difference between terms: 9 - 5 = 4, 13 - 9 = 4. The sequence increases by 4 each time.",
              "The general term has the form 4n + (a constant). Test n = 1: 4(1) + constant = 5, so the constant is 1.",
              "Check with n = 2: 4(2) + 1 = 9, which matches.",
              "The general term is 4n + 1.",
            ],
          },
          {
            problem: "Using the general term 4n + 1, find the 20th term of the sequence.",
            solution: ["Substitute n = 20 into the general term 4n + 1.", "4 × 20 = 80", "80 + 1 = 81", "The 20th term is 81."],
          },
        ],
        teachingSteps: [
          "Activate prior knowledge: recap the P6 number-pattern work (identifying the rule, extending a few terms).",
          "Worked example: for a simple linear sequence, find the common difference and describe the rule in words first.",
          "Worked example 2: translate the word-rule into a general algebraic term (e.g. 'multiply the position by 3, then add 1' becomes 3n + 1).",
          "Guided practice: find the general term for 2-3 more sequences together, always going word-rule first, then algebra.",
          "Independent practice: have students find the general term of a new sequence and use it to find a distant term (e.g. the 50th term) without listing every term.",
          "Check for understanding: ask a student to verify their general term by checking it against the 1st and 2nd actual terms of the sequence.",
        ],
      },
      {
        title: "Speed and Average Rate",
        strand: "Number and Algebra",
        description:
          "Newly relocated to Secondary 1 in the current syllabus: speed, distance and time relationships, and average speed over a journey with multiple stages. The distance-speed-time triangle is a well-worn but genuinely effective memory aid here.",
        conceptExplanation:
          "Speed is a specific type of rate that relates distance and time — it tells you how much distance is covered in one unit of time. The relationship between the three quantities is speed = distance ÷ time, which can be rearranged to find distance (distance = speed × time) or time (time = distance ÷ speed) depending on which two values are known. Average speed over a journey with multiple stages at different speeds is NOT simply the average of the different speeds — it must be calculated as the total distance travelled divided by the total time taken for the whole journey.",
        workedExamples: [
          {
            problem: "A car travels 180 km in 3 hours. Find its speed.",
            solution: ["Speed = distance ÷ time", "Speed = 180 ÷ 3", "The car's speed is 60 km/h."],
          },
          {
            problem: "A cyclist travels 40 km at 20 km/h, then another 30 km at 30 km/h. Find the average speed for the whole journey.",
            solution: [
              "Find the total distance: 40 + 30 = 70 km",
              "Find the time for the first part: 40 ÷ 20 = 2 hours",
              "Find the time for the second part: 30 ÷ 30 = 1 hour",
              "Total time: 2 + 1 = 3 hours",
              "Average speed = total distance ÷ total time = 70 ÷ 3 = 23.3 km/h (1 d.p.)",
            ],
          },
        ],
        teachingSteps: [
          "Introduce: connect speed to the P5 'rate' topic (speed is just a rate of distance per time), then introduce the distance-speed-time triangle as a quick-reference tool.",
          "Worked example: find speed given distance and time, then rearrange the same triangle to find distance given speed and time.",
          "Guided practice: solve 2-3 more single-stage speed/distance/time problems together, alternating which quantity is missing.",
          "Worked example 2: solve an average speed problem over a journey with two stages of different speeds, explicitly using total distance ÷ total time (not averaging the two speeds directly).",
          "Independent practice: have students solve one single-stage and one multi-stage average speed problem.",
          "Check for understanding: ask why averaging two speeds directly (e.g. (60+40)/2) is usually wrong for average speed, and have the student explain using total distance/total time.",
        ],
      },
      {
        title: "Angles, Triangles and Polygons",
        diagram: { type: "right-triangle", legs: ["6 cm", "8 cm"], hypotenuse: "10 cm" },
        strand: "Geometry and Measurement",
        description:
          "Angle properties of parallel lines (corresponding, alternate, co-interior angles), and angle sums of triangles and polygons. Parallel-line angle rules are frequently mixed up — colour-code the angle types the first few times a student practises.",
        conceptExplanation:
          "When a line (called a transversal) crosses two parallel lines, it creates several pairs of angles with special relationships: corresponding angles are equal (in matching positions at each intersection), alternate angles are equal (on opposite sides of the transversal, between the parallel lines), and co-interior angles add up to 180° (on the same side, between the parallel lines). These rules only apply because the two lines are parallel — recognising which angle pair you're looking at is the key skill for using the correct rule. Combined with the primary-level facts (angles on a line = 180°, angles in a triangle = 180°), these rules let you find unknown angles in increasingly complex diagrams.",
        workedExamples: [
          {
            problem: "Two parallel lines are cut by a transversal. One angle is 65°. Find its corresponding angle.",
            solution: [
              "Corresponding angles (in matching positions at each intersection) are equal when lines are parallel.",
              "The corresponding angle is also 65°.",
            ],
          },
          {
            problem: "Two parallel lines are cut by a transversal, creating a pair of co-interior angles. One is 110°. Find the other.",
            solution: [
              "Co-interior angles (on the same side, between the parallel lines) add up to 180°.",
              "The other angle = 180 - 110",
              "The other angle is 70°.",
            ],
          },
        ],
        teachingSteps: [
          "Activate prior knowledge: recap the P6 angle facts (angles on a line, around a point, in a triangle).",
          "Introduce: draw two parallel lines cut by a transversal, colour-coding corresponding, alternate and co-interior angle pairs.",
          "Worked example: find a missing angle using one parallel-line rule, explicitly naming which coloured pair and rule was used.",
          "Guided practice: find missing angles in 3-4 more parallel-line diagrams together, continuing to colour-code.",
          "Worked example 2: find the angle sum of a polygon by splitting it into triangles from one vertex.",
          "Independent practice: have students solve one parallel-line problem and one polygon angle-sum problem on their own.",
          "Check for understanding: give a diagram with multiple angle pairs and have the student justify each step by naming the specific rule used, not just writing the answer.",
        ],
      },
      {
        title: "Perimeter, Area and Volume of Prisms",
        strand: "Geometry and Measurement",
        description:
          "Extends primary mensuration to prisms, including finding volume as cross-sectional area × length. Identifying the correct cross-section is the key new skill — have students physically trace the cross-section on a 3D diagram before calculating.",
        conceptExplanation:
          "A prism is a 3D solid with a constant cross-section — the same 2D shape repeated all along its length, like a stack of identical slices. The volume of a prism is found using cross-sectional area × length, which extends the idea of a cuboid's volume (where the cross-section is simply a rectangle) to prisms with other cross-section shapes, like triangles or trapeziums. To find the volume, first identify and calculate the area of the repeating cross-section shape, then multiply by how long the prism is (the length in the direction the cross-section repeats).",
        workedExamples: [
          {
            problem: "A triangular prism has a triangular cross-section with area 12 cm² and a length of 10 cm. Find its volume.",
            solution: ["Volume of a prism = cross-sectional area × length", "Volume = 12 × 10", "The volume is 120 cm³."],
          },
          {
            problem: "A prism's cross-section is a rectangle 4 cm by 3 cm. The prism is 8 cm long. Find its volume.",
            solution: [
              "Find the cross-sectional area: 4 × 3 = 12 cm²",
              "Volume = cross-sectional area × length = 12 × 8",
              "The volume is 96 cm³ (note: this is the same as treating it as a cuboid, since a rectangular cross-section prism IS a cuboid).",
            ],
          },
        ],
        teachingSteps: [
          "Activate prior knowledge: recap finding the area of 2D shapes (rectangle, triangle) from primary school.",
          "Introduce: show a prism and have students physically trace its cross-section (the repeating 2D shape) on the diagram before anything else.",
          "Worked example: calculate the cross-sectional area, then multiply by the prism's length to find volume, narrating why this works (stacking identical cross-sections).",
          "Guided practice: find the volume of 2-3 more prisms with different cross-section shapes together.",
          "Worked example 2: find the total surface area of a prism by identifying and summing each distinct face.",
          "Independent practice: have students find the volume and surface area of a new prism on their own.",
          "Check for understanding: give a prism drawn at an unusual angle and check the student can still correctly identify the cross-section before calculating.",
        ],
      },
    ],
  },
  {
    level: "SEC2",
    topics: [
      {
        title: "Direct and Inverse Proportion",
        strand: "Number and Algebra",
        description:
          "Distinguishing direct from inverse proportion and solving related problems, including map scale as an application of direct proportion. Ask whether one quantity doubling makes the other double or halve as a quick diagnostic for which type of proportion applies.",
        conceptExplanation:
          "Two quantities are in direct proportion if they increase or decrease together at the same rate — if one doubles, the other doubles too (like cost and quantity when the price per item stays fixed). Two quantities are in inverse proportion if one increases as the other decreases — if one doubles, the other halves (like the number of workers and the time taken to finish a fixed amount of work). A quick way to tell which type applies is to ask: 'if this quantity doubles, does the other one double too, or does it halve?' Direct proportion problems are typically solved with the unitary method (find the value for 1 unit, then scale), while inverse proportion problems use the fact that the PRODUCT of the two quantities stays constant.",
        workedExamples: [
          {
            problem: "5 identical pens cost $10. Find the cost of 8 pens (direct proportion).",
            solution: [
              "Cost and quantity are directly proportional — more pens cost more, at a fixed rate.",
              "Find the cost of 1 pen: $10 ÷ 5 = $2",
              "Find the cost of 8 pens: $2 × 8 = $16",
            ],
          },
          {
            problem: "6 workers can complete a job in 10 days. How many days would 4 workers take (inverse proportion, same total work)?",
            solution: [
              "Workers and days are inversely proportional — fewer workers take more days for the same amount of work.",
              "The product (workers × days) stays constant: 6 × 10 = 60 (this represents the total 'worker-days' of work).",
              "With 4 workers: days = 60 ÷ 4",
              "4 workers would take 15 days.",
            ],
          },
        ],
        teachingSteps: [
          "Activate prior knowledge: recap the P5/P6 rate work as a lead-in to proportion.",
          "Introduce: pose the diagnostic question for two related quantities ('if one doubles, does the other double or halve?') to classify direct vs inverse proportion.",
          "Worked example: solve a direct proportion problem (e.g. cost scales with quantity) using the unitary method.",
          "Worked example 2: solve an inverse proportion problem (e.g. more workers means less time), contrasting the calculation method directly against the direct-proportion example.",
          "Guided practice: solve 2-3 more mixed direct/inverse problems together, always starting with the diagnostic question.",
          "Independent practice: have students solve a map-scale problem as a real-world application of direct proportion.",
          "Check for understanding: give a new scenario and ask the student to classify it as direct or inverse before solving, to confirm the diagnostic habit has stuck.",
        ],
      },
      {
        title: "Expansion and Factorisation of Quadratic Expressions",
        strand: "Number and Algebra",
        description:
          "Expanding products of two linear expressions and factorising simple quadratic expressions, including special products (difference of two squares, perfect squares). Treat factorisation as expansion in reverse — checking a factorised answer by re-expanding it catches most mistakes.",
        conceptExplanation:
          "Expanding the product of two linear brackets, like (x + 2)(x + 3), means multiplying every term in the first bracket by every term in the second bracket, then combining like terms — this always produces a quadratic expression (one containing an x² term). Factorisation is the reverse process: starting with a quadratic expression and rewriting it as a product of two brackets. Two special patterns are worth recognising directly: the 'difference of two squares' (a² - b² = (a+b)(a-b)) and the 'perfect square' ((a+b)² = a² + 2ab + b²) — spotting these patterns makes factorising much faster than always working from scratch.",
        workedExamples: [
          {
            problem: "Expand: (x + 2)(x + 3)",
            solution: [
              "Multiply every term in the first bracket by every term in the second bracket.",
              "x × x = x², x × 3 = 3x, 2 × x = 2x, 2 × 3 = 6",
              "Combine: x² + 3x + 2x + 6",
              "Combine like terms (3x + 2x = 5x): x² + 5x + 6",
            ],
          },
          {
            problem: "Factorise: x² + 5x + 6",
            solution: [
              "Find two numbers that multiply to give 6 (the constant) and add to give 5 (the coefficient of x).",
              "The numbers 2 and 3 work: 2 × 3 = 6, and 2 + 3 = 5.",
              "x² + 5x + 6 = (x + 2)(x + 3)",
              "Check by re-expanding: (x + 2)(x + 3) = x² + 5x + 6, which matches.",
            ],
          },
        ],
        teachingSteps: [
          "Activate prior knowledge: recap expanding a single bracket from Sec1.",
          "Worked example: expand the product of two linear brackets using a grid or area method, then the standard method.",
          "Worked example 2: introduce the two special products (difference of two squares, perfect square) by expanding them and spotting the resulting pattern.",
          "Guided practice: expand 2-3 more bracket pairs together, including at least one special-product case.",
          "Worked example 3: factorise a simple quadratic by reversing the expansion process, then verify by re-expanding the factorised answer.",
          "Independent practice: have students factorise a short set of quadratics, checking each by re-expansion.",
          "Check for understanding: give a factorised answer with a sign error and have the student catch it by re-expanding.",
        ],
      },
      {
        title: "Linear Graphs and Simultaneous Equations",
        strand: "Number and Algebra",
        description:
          "Plotting linear graphs, finding gradient and equation of a line, and solving simultaneous linear equations both graphically and algebraically. Solve the same pair of equations both ways so students see the graphical intersection and the algebraic solution are the same answer.",
        conceptExplanation:
          "A linear graph is a straight line representing an equation of the form y = mx + c, where m is the gradient (how steep the line is, and whether it rises or falls) and c is the y-intercept (where the line crosses the y-axis). When two linear equations are graphed on the same axes, the point where the two lines cross (intersect) is the one point that satisfies BOTH equations at once — this is called the simultaneous solution. The same solution can also be found algebraically, without graphing, using substitution (replacing one variable with an expression from the other equation) or elimination (adding or subtracting the equations to remove one variable) — both methods give the exact same answer as reading the graph's intersection point.",
        workedExamples: [
          {
            problem: "Find the gradient and y-intercept of the line y = 3x + 2.",
            solution: [
              "The equation is in the form y = mx + c.",
              "Comparing, m = 3 (the gradient) and c = 2 (the y-intercept).",
              "The gradient is 3 and the y-intercept is 2 (the line crosses the y-axis at (0, 2)).",
            ],
          },
          {
            problem: "Solve the simultaneous equations: y = x + 2 and y = 3x - 4",
            solution: [
              "Since both expressions equal y, set them equal to each other: x + 2 = 3x - 4",
              "Rearrange: 2 + 4 = 3x - x, so 6 = 2x",
              "x = 3",
              "Substitute x = 3 back into y = x + 2: y = 3 + 2 = 5",
              "The solution is x = 3, y = 5.",
            ],
          },
        ],
        teachingSteps: [
          "Introduce: plot a linear graph from a table of values, discussing what the gradient (steepness) and y-intercept represent visually.",
          "Worked example: find the gradient and equation of a line from two given points.",
          "Introduce: plot two linear graphs on the same axes and identify their intersection point as the solution to both equations simultaneously.",
          "Worked example 2: solve the same pair of equations algebraically (substitution or elimination), showing the answer matches the graph's intersection point exactly.",
          "Guided practice: solve 2-3 more simultaneous equation pairs algebraically together.",
          "Independent practice: have students solve one simultaneous equation pair algebraically and verify it against a quick sketch.",
          "Check for understanding: ask a student to explain, in their own words, what it means for a point to 'satisfy both equations,' connecting it back to the graphical picture.",
        ],
      },
      {
        title: "Linear Inequalities",
        strand: "Number and Algebra",
        description:
          "Solving and representing linear inequalities on a number line, including the effect of multiplying/dividing by a negative number. The sign-flip rule when multiplying/dividing by a negative is the single most-forgotten rule at this level — test it explicitly and often.",
        conceptExplanation:
          "A linear inequality is like a linear equation but uses an inequality sign (<, >, ≤, or ≥) instead of an equals sign, and solving it means finding the RANGE of values that make it true, rather than a single value. Solving follows the same steps as solving an equation (do the same thing to both sides), with one crucial exception: multiplying or dividing both sides by a NEGATIVE number flips the direction of the inequality sign. This is because multiplying by a negative number reverses the order of numbers on the number line — for example, 2 < 4 is true, but multiplying both sides by -1 gives -2 and -4, where -2 > -4, so the sign must flip to keep the statement true.",
        workedExamples: [
          {
            problem: "Solve: 2x + 3 < 11",
            solution: [
              "Subtract 3 from both sides: 2x < 8",
              "Divide both sides by 2 (a positive number, so the sign stays the same): x < 4",
            ],
          },
          {
            problem: "Solve: -3x + 6 > 15",
            solution: [
              "Subtract 6 from both sides: -3x > 9",
              "Divide both sides by -3. Since we are dividing by a negative number, the inequality sign flips: x < -3",
            ],
          },
        ],
        teachingSteps: [
          "Activate prior knowledge: recap solving a linear equation, noting the similarity to solving an inequality.",
          "Worked example: solve a simple inequality that doesn't require multiplying/dividing by a negative, representing the solution on a number line.",
          "Introduce: test a true inequality (e.g. 2 < 4) by multiplying both sides by -1, showing the inequality sign must flip to stay true.",
          "Worked example 2: solve an inequality requiring division by a negative, explicitly narrating the sign flip.",
          "Guided practice: solve 2-3 more inequalities together, deliberately mixing cases that do and don't need a sign flip.",
          "Independent practice: have students solve a short set of inequalities and represent each on a number line.",
          "Check for understanding: give an inequality requiring a sign flip and specifically check whether the student remembers to flip it without being prompted.",
        ],
      },
      {
        title: "Congruence and Similarity",
        strand: "Geometry and Measurement",
        description:
          "Conditions for congruent triangles (SSS, SAS, AAS, RHS) and properties of similar figures, including scale factor. Have students identify matching angles/sides in the correct order — mismatched correspondence is the most common source of wrong answers here.",
        conceptExplanation:
          "Two shapes are congruent if they are exactly the same size and shape — one could be placed exactly on top of the other with a perfect match. For triangles, there are specific conditions that guarantee congruence without needing to check every side and angle: SSS (all three sides match), SAS (two sides and the angle between them match), AAS (two angles and a side match), and RHS (right angle, hypotenuse, and one other side match, for right-angled triangles). Two shapes are similar if they have the same shape but different sizes — all corresponding angles are equal, and all corresponding sides are in the same ratio (called the scale factor), which can be used to find an unknown length in one shape if the corresponding length in the other is known.",
        workedExamples: [
          {
            problem: "Two triangles have sides of 5 cm, 6 cm, 7 cm and 5 cm, 6 cm, 7 cm respectively. Are they congruent, and by which condition?",
            solution: [
              "Compare all three sides of each triangle: 5, 6, 7 in both.",
              "All three corresponding sides match exactly.",
              "The triangles are congruent by the SSS (side-side-side) condition.",
            ],
          },
          {
            problem: "Two similar triangles have corresponding sides of 4 cm and 10 cm. If the smaller triangle's other side is 6 cm, find the corresponding side in the larger triangle.",
            solution: [
              "Find the scale factor: 10 ÷ 4 = 2.5",
              "Multiply the smaller triangle's other side by the scale factor: 6 × 2.5",
              "The corresponding side in the larger triangle is 15 cm.",
            ],
          },
        ],
        teachingSteps: [
          "Introduce: show two congruent triangles and have students physically match corresponding sides and angles, labelling them in the correct order.",
          "Worked example: use one congruence condition (e.g. SSS) to justify why two triangles are congruent, referencing the matched labels.",
          "Guided practice: identify the correct congruence condition for 2-3 more triangle pairs together.",
          "Worked example 2: for similar figures, find an unknown side length using the scale factor, setting up the ratio from clearly corresponding sides.",
          "Independent practice: have students solve one congruence-condition problem and one similar-figures scale-factor problem.",
          "Check for understanding: give two similar figures drawn in different orientations and check the student still matches corresponding sides correctly rather than by position on the page.",
        ],
      },
      {
        title: "Pythagoras' Theorem",
        strand: "Geometry and Measurement",
        description:
          "Using a-squared plus b-squared equals c-squared to find an unknown side in a right-angled triangle, and applying it to real-world and coordinate geometry problems. Always have students identify the hypotenuse first — using the theorem with the wrong side as c is the classic error.",
        conceptExplanation:
          "Pythagoras' Theorem states that in a right-angled triangle, the square of the hypotenuse (the longest side, opposite the right angle) equals the sum of the squares of the other two sides: a² + b² = c², where c is the hypotenuse. This relationship only works for right-angled triangles — it cannot be applied to any other type of triangle. The theorem can be rearranged to find any one of the three sides, as long as the other two are known: if the hypotenuse is unknown, use c² = a² + b²; if a shorter side is unknown, use a² = c² - b² (subtracting instead of adding).",
        workedExamples: [
          {
            problem: "A right-angled triangle has two shorter sides of 3 cm and 4 cm. Find the hypotenuse.",
            solution: [
              "Use a² + b² = c², where a = 3 and b = 4.",
              "3² + 4² = 9 + 16 = 25",
              "c² = 25, so c = √25",
              "The hypotenuse is 5 cm.",
            ],
          },
          {
            problem: "A right-angled triangle has a hypotenuse of 13 cm and one shorter side of 5 cm. Find the other shorter side.",
            solution: [
              "Use a² = c² - b², where c = 13 (hypotenuse) and b = 5 (known shorter side).",
              "13² - 5² = 169 - 25 = 144",
              "a² = 144, so a = √144",
              "The other shorter side is 12 cm.",
            ],
          },
        ],
        teachingSteps: [
          "Introduce: show a right-angled triangle and have students identify the hypotenuse (the longest side, opposite the right angle) before anything else.",
          "Worked example: find the hypotenuse given the two shorter sides, narrating a-squared plus b-squared equals c-squared.",
          "Worked example 2: find a shorter side given the hypotenuse and one other side, rearranging the formula.",
          "Guided practice: solve 2-3 more Pythagoras problems together, always identifying the hypotenuse first as a fixed first step.",
          "Independent practice: have students solve one real-world application problem (e.g. a ladder against a wall) using Pythagoras' theorem.",
          "Check for understanding: give a triangle drawn with the right angle NOT in the bottom corner, to check the student still correctly identifies the hypotenuse regardless of orientation.",
        ],
      },
      {
        title: "Volume and Surface Area of Pyramids, Cones and Spheres",
        strand: "Geometry and Measurement",
        description:
          "Applying the volume/surface area formulas for pyramids, cones and spheres, distinguishing them from the prism formulas learned at Sec1. Keep a single reference sheet of all mensuration formulas side by side — the goal is choosing the right one, not deriving it from scratch each time.",
        conceptExplanation:
          "These solids each have their own volume and surface area formulas, distinct from the prism formulas (cross-sectional area × length) learned at Sec1: a pyramid's volume is 1/3 × base area × height, a cone's volume is 1/3 × π × r² × height (essentially a pyramid with a circular base), and a sphere's volume is 4/3 × π × r³. The '1/3' in the pyramid and cone formulas reflects that they taper to a point, containing exactly one-third of the volume of a prism/cylinder with the same base and height. Because there are several different formulas to keep track of, choosing the CORRECT formula for the given solid is the main skill being tested, more than the arithmetic itself.",
        workedExamples: [
          {
            problem: "A pyramid has a base area of 24 cm² and a height of 9 cm. Find its volume.",
            solution: ["Volume of a pyramid = 1/3 × base area × height", "Volume = 1/3 × 24 × 9", "24 × 9 = 216, then 216 ÷ 3 = 72", "The volume is 72 cm³."],
          },
          {
            problem: "A sphere has a radius of 3 cm. Find its volume in terms of π.",
            solution: [
              "Volume of a sphere = 4/3 × π × r³",
              "r³ = 3³ = 27",
              "Volume = 4/3 × π × 27",
              "4 × 27 = 108, then 108 ÷ 3 = 36",
              "The volume is 36π cm³.",
            ],
          },
        ],
        teachingSteps: [
          "Review: build a single reference sheet listing the Sec1 prism formulas alongside the new pyramid, cone and sphere formulas side by side.",
          "Worked example: calculate the volume of a pyramid, explicitly referencing the reference sheet and noting how it differs from a prism of the same base.",
          "Guided practice: calculate the volume of a cone and a sphere together, again referencing the sheet each time.",
          "Worked example 2: calculate the surface area of one of the solids, breaking it into its component faces or curved surface.",
          "Independent practice: have students calculate the volume of one solid and the surface area of another, choosing the correct formula from the reference sheet themselves.",
          "Check for understanding: give a mixed set of solids and have the student identify which formula applies to each without calculating, to test formula selection specifically.",
        ],
      },
      {
        title: "Statistics: Histograms, Mean and Probability",
        strand: "Statistics and Probability",
        description:
          "Constructing and interpreting histograms and stem-and-leaf diagrams, calculating the mean from grouped data, and formal (theoretical) probability. This formalises the intuitive P6 probability work into calculated probabilities of single events.",
        conceptExplanation:
          "A histogram is similar to a bar graph but is used for continuous, grouped data (like heights or weights grouped into ranges), and unlike a regular bar graph, the WIDTH of each bar matters because it represents the size of that data group — the bars are typically drawn touching each other since the data is continuous. When data is grouped into ranges (like '10-19', '20-29'), the exact mean can't be calculated since individual values aren't known, so the midpoint of each group is used as an estimate, giving an ESTIMATED mean rather than an exact one. Theoretical probability, formalised at this level, is calculated as the number of favourable outcomes divided by the total number of equally likely possible outcomes.",
        workedExamples: [
          {
            problem: "A frequency table shows 5 students scored in the range 10-19 (midpoint 14.5) and 8 students scored in the range 20-29 (midpoint 24.5). Estimate the mean score.",
            solution: [
              "Multiply each group's midpoint by its frequency: 14.5 × 5 = 72.5, and 24.5 × 8 = 196",
              "Add these products together: 72.5 + 196 = 268.5",
              "Divide by the total number of students: 5 + 8 = 13, so 268.5 ÷ 13",
              "The estimated mean score is approximately 20.7 (1 d.p.).",
            ],
          },
          {
            problem: "A bag contains 4 red balls and 6 blue balls. Find the theoretical probability of picking a blue ball.",
            solution: [
              "Total possible outcomes (total balls): 4 + 6 = 10",
              "Favourable outcomes (blue balls): 6",
              "Probability = favourable ÷ total = 6/10, which simplifies to 3/5",
            ],
          },
        ],
        teachingSteps: [
          "Introduce: build a stem-and-leaf diagram from a small raw data set together, discussing what it reveals about the data's spread.",
          "Worked example: construct a histogram from grouped data, discussing why bar width matters (unlike a simple bar graph).",
          "Worked example 2: calculate the mean from a frequency table, using the midpoint of each group for grouped data.",
          "Review: recap the P6 intuitive probability work, then formalise it as favourable outcomes over total possible outcomes.",
          "Guided practice: calculate 2-3 theoretical probabilities together for single events (dice, cards, spinners).",
          "Independent practice: have students calculate a mean from grouped data and one theoretical probability on their own.",
          "Check for understanding: ask a student to explain why the mean from grouped data is an estimate, not an exact value, since individual raw data points aren't known.",
        ],
      },
    ],
  },
  {
    level: "SEC3",
    topics: [
      {
        title: "Indices and Standard Form",
        strand: "Number and Algebra",
        description:
          "The laws of indices (including negative and fractional indices) and writing very large/small numbers in standard form. Drill the index laws as algebraic rules first, then apply them to standard form — students often try to memorise standard form as a separate, unrelated skill.",
        conceptExplanation:
          "The laws of indices are rules for simplifying expressions with powers: when multiplying powers of the same base, add the indices (x² × x³ = x⁵); when dividing, subtract the indices (x⁵ ÷ x² = x³). A negative index means the reciprocal — x⁻² = 1/x² — which follows naturally from continuing the division pattern below zero. A fractional index means a root — x^(1/2) means the square root of x, and x^(1/3) means the cube root. Standard form writes very large or very small numbers as a number between 1 and 10 multiplied by a power of 10 (like 3.2 × 10⁵), which uses these same index laws to work with such numbers more easily.",
        workedExamples: [
          {
            problem: "Simplify: x⁵ × x³",
            solution: [
              "When multiplying powers of the same base, add the indices.",
              "x⁵ × x³ = x^(5+3)",
              "x⁵ × x³ = x⁸",
            ],
          },
          {
            problem: "Write 45,000 in standard form.",
            solution: [
              "Write the number as a value between 1 and 10: 4.5",
              "Count how many places the decimal point moved from 4.5 to 45,000: 4 places to the right.",
              "This means multiplying by 10⁴.",
              "45,000 = 4.5 × 10⁴",
            ],
          },
        ],
        teachingSteps: [
          "Activate prior knowledge: recap basic positive-index rules (e.g. multiplying powers of the same base) from earlier levels.",
          "Worked example: derive the negative-index rule by extending the pattern of dividing powers past zero, rather than stating it as an arbitrary rule.",
          "Worked example 2: derive the fractional-index rule by connecting it to roots (e.g. x^(1/2) is the square root of x).",
          "Guided practice: simplify 3-4 expressions using the index laws together, mixing negative and fractional cases.",
          "Worked example 3: convert a very large and a very small number into standard form, explicitly using the index laws just practised, not a separate memorised trick.",
          "Independent practice: have students simplify a set of index expressions and convert two numbers to standard form.",
          "Check for understanding: give a standard-form calculation (multiplying two numbers in standard form) and check the student applies the index laws rather than reverting to decimal form.",
        ],
      },
      {
        title: "Quadratic Equations and Graphs",
        strand: "Number and Algebra",
        description:
          "Solving quadratic equations by factorisation, completing the square and the quadratic formula, and sketching quadratic graphs. Connect the three solving methods back to the Sec2 factorisation work, and show that all three methods agree on the same answer for a given equation.",
        conceptExplanation:
          "A quadratic equation contains a squared term (x²) and can be solved using several methods that all give the same answer: factorisation (rewriting as two brackets and setting each to zero), completing the square (rewriting in the form (x + a)² = b), or the quadratic formula (a general formula that works for any quadratic). The quadratic formula is the most reliable when the equation doesn't factorise neatly. A quadratic equation's graph is a curve called a parabola — its roots (solutions) are exactly where the graph crosses the x-axis, its turning point is the highest or lowest point of the curve, and the axis of symmetry is the vertical line passing through the turning point that the curve is a mirror image around.",
        workedExamples: [
          {
            problem: "Solve by factorisation: x² - 5x + 6 = 0",
            solution: [
              "Find two numbers that multiply to give 6 and add to give -5: -2 and -3.",
              "Factorise: (x - 2)(x - 3) = 0",
              "Set each factor to zero: x - 2 = 0 or x - 3 = 0",
              "x = 2 or x = 3",
            ],
          },
          {
            problem: "Solve using the quadratic formula: x² + 2x - 3 = 0",
            solution: [
              "Identify a = 1, b = 2, c = -3 from ax² + bx + c = 0.",
              "Use x = (-b ± √(b² - 4ac)) ÷ 2a",
              "Calculate the discriminant: b² - 4ac = 2² - 4(1)(-3) = 4 + 12 = 16",
              "x = (-2 ± √16) ÷ 2 = (-2 ± 4) ÷ 2",
              "x = (-2 + 4) ÷ 2 = 1, or x = (-2 - 4) ÷ 2 = -3",
            ],
          },
        ],
        teachingSteps: [
          "Activate prior knowledge: recap factorising a quadratic expression from Sec2.",
          "Worked example: solve a quadratic equation by factorisation, setting each factor to zero.",
          "Worked example 2: solve the SAME equation by completing the square, showing the answers match.",
          "Worked example 3: solve the SAME equation again using the quadratic formula, confirming all three methods agree.",
          "Discuss: discuss when factorisation isn't practical and the formula becomes the more reliable default method.",
          "Guided practice: sketch a quadratic graph together, identifying roots, turning point and axis of symmetry from the solved equation.",
          "Independent practice: have students solve one quadratic equation using their preferred method and sketch its graph.",
          "Check for understanding: give a quadratic that doesn't factorise neatly and check the student correctly switches to the formula rather than forcing a factorisation.",
        ],
      },
      {
        title: "Linear Inequalities in Two Unknowns",
        strand: "Number and Algebra",
        description:
          "Extending inequalities to two variables and representing regions on a graph, building toward optimisation-style problems. Shading the wrong side of the boundary line is the most common error — test a point (like the origin) to check which side is correct.",
        conceptExplanation:
          "An inequality with two variables (like x + y < 10) represents a whole REGION on a graph, not just a line — every point in that region makes the inequality true. The boundary line is drawn solid if the inequality includes 'equal to' (≤ or ≥, meaning the line itself is included) or dashed if it's strict (< or >, meaning the line itself is not included). To decide which side of the line to shade, test any point not on the line (the origin, (0,0), is often the easiest) in the original inequality — if it makes the inequality true, shade the side containing that point; if false, shade the other side. When several inequalities are graphed together, the region where all their shaded areas overlap is called the feasible region.",
        workedExamples: [
          {
            problem: "For the inequality x + y < 6, determine which side of the line x + y = 6 to shade, using the origin as a test point.",
            solution: [
              "Test the origin (0, 0) in the inequality: 0 + 0 < 6",
              "0 < 6 is TRUE.",
              "Since the origin makes the inequality true, shade the side of the line containing the origin.",
            ],
          },
          {
            problem: "For the inequality y ≥ 2x, why can't the origin be used as the test point?",
            solution: [
              "The boundary line is y = 2x.",
              "Substituting the origin (0, 0): is 0 a point ON the line? Check: 0 = 2(0), which is true.",
              "Since the origin lies ON the boundary line itself, it cannot be used to test which SIDE to shade — a different point not on the line must be chosen instead.",
            ],
          },
        ],
        teachingSteps: [
          "Activate prior knowledge: recap the Sec2 one-variable inequality work.",
          "Introduce: plot the boundary line for a two-variable inequality, discussing whether it should be solid (≤/≥) or dashed (</>) based on the inequality sign.",
          "Worked example: test a simple point (like the origin) in the original inequality to determine which side of the line to shade.",
          "Guided practice: shade the regions for 2-3 more inequalities together, always testing a point first rather than guessing.",
          "Worked example 2: combine 2-3 inequalities on the same graph to find the overlapping feasible region.",
          "Independent practice: have students graph one inequality region and one combined feasible region on their own.",
          "Check for understanding: give a boundary line that passes through the origin (so the origin can't be used as the test point) and check the student picks a different valid test point.",
        ],
      },
      {
        title: "Set Language and Venn Diagrams",
        diagram: { type: "venn", setA: "Multiples of 2", setB: "Multiples of 3", onlyA: "2, 4, 8, 10", both: "6, 12", onlyB: "3, 9, 15" },
        strand: "Number and Algebra",
        description:
          "Set notation, operations (union, intersection, complement) and using Venn diagrams to solve problems, including with three sets. Work through problems by filling the Venn diagram from the innermost region outward — it avoids double-counting overlapping elements.",
        conceptExplanation:
          "A set is a collection of distinct items, and set notation provides a shorthand for describing relationships between sets: the union (A ∪ B) means everything in A OR B (or both), the intersection (A ∩ B) means only what's in BOTH A and B, and the complement (A') means everything NOT in A. A Venn diagram represents sets as overlapping circles, where the overlapping region shows the intersection. When filling in a Venn diagram from given information, it's essential to start with the innermost region (the intersection of all the sets involved) FIRST, since the counts for the outer regions depend on already knowing the overlap — filling from the outside in causes elements to be double-counted.",
        workedExamples: [
          {
            problem: "In a class of 30 students, 18 like football (F) and 15 like basketball (B), and 8 like both. How many students like only football?",
            solution: [
              "Start with the innermost region: 8 students like both (the intersection).",
              "Students who like football total 18, which includes the 8 who like both.",
              "Students who like ONLY football = total football - both = 18 - 8",
              "10 students like only football.",
            ],
          },
          {
            problem: "Using the same information, how many students like neither football nor basketball?",
            solution: [
              "Students who like only football: 18 - 8 = 10",
              "Students who like only basketball: 15 - 8 = 7",
              "Students who like at least one sport: 10 (only football) + 7 (only basketball) + 8 (both) = 25",
              "Students who like neither: 30 - 25 = 5",
            ],
          },
        ],
        teachingSteps: [
          "Introduce: introduce set notation (union, intersection, complement) using a simple two-set real-world example (e.g. students who like football vs. basketball).",
          "Worked example: fill a two-set Venn diagram from given information, explicitly starting with the innermost (intersection) region first.",
          "Guided practice: fill 1-2 more two-set Venn diagrams together, always starting from the intersection.",
          "Worked example 2: extend to a three-set Venn diagram, again filling from the innermost region (all three overlapping) outward.",
          "Independent practice: have students solve one three-set Venn diagram problem on their own.",
          "Check for understanding: ask a student to explain why filling from the innermost region outward avoids double-counting, using their completed diagram as the example.",
        ],
      },
      {
        title: "Congruence, Similarity and Circle Properties",
        strand: "Geometry and Measurement",
        description:
          "Circle theorems covering symmetry properties (equal chords, perpendicular bisectors) and angle properties (angle in a semicircle, angles in the same segment). Have students name which specific theorem justifies each step — vague 'it just looks equal' reasoning doesn't hold up in proofs.",
        conceptExplanation:
          "Circle theorems describe special, always-true angle and length relationships within circles. Two key symmetry properties are: a line from the centre perpendicular to a chord always bisects (cuts exactly in half) that chord, and equal chords are always equidistant from the centre. Two key angle properties are: an angle in a semicircle (formed using the diameter as one side) is always exactly 90°, and angles in the same segment (subtended by the same arc, on the same side) are always equal to each other. Each of these theorems has a specific name and specific conditions for when it applies, which must be correctly identified and stated when using it to justify a step in a solution.",
        workedExamples: [
          {
            problem: "A chord in a circle has its perpendicular bisector drawn from the centre. If the chord is 16 cm long, what is the distance from the centre to each end of the chord's midpoint split?",
            solution: [
              "The theorem states a perpendicular from the centre to a chord bisects the chord.",
              "The chord is 16 cm, so it is split into two equal halves.",
              "Each half is 16 ÷ 2 = 8 cm.",
            ],
          },
          {
            problem: "A triangle is formed by a diameter and a point on the circle. What is the angle at that point?",
            solution: [
              "The theorem states an angle in a semicircle (formed using the diameter) is always 90°.",
              "The angle at that point is 90°.",
            ],
          },
        ],
        teachingSteps: [
          "Review: recap Sec2 congruence and similarity conditions as a quick warm-up.",
          "Introduce: state one circle symmetry theorem (e.g. a perpendicular from the centre bisects a chord) and demonstrate it on a drawn circle.",
          "Worked example: use that theorem to find an unknown length in a circle problem, naming the theorem explicitly in the working.",
          "Introduce: state one circle angle theorem (e.g. angle in a semicircle is 90°) and demonstrate it similarly.",
          "Guided practice: solve 2-3 more circle theorem problems together, requiring the specific theorem to be named for each step.",
          "Independent practice: have students solve one circle theorem problem, writing the theorem name alongside each step of working.",
          "Check for understanding: mark a student's solution specifically for whether each step cites a real theorem, not just a visually 'obvious' claim.",
        ],
      },
      {
        title: "Trigonometry: Sine Rule, Cosine Rule and Area of Triangle",
        strand: "Geometry and Measurement",
        description:
          "Extends right-angle trigonometry to any triangle using the sine rule, cosine rule and the half-ab-sin-C area formula. The key new skill is choosing which rule applies — build a simple decision checklist (what's given: two sides and an angle? all three sides?) before calculating.",
        conceptExplanation:
          "The sine rule and cosine rule extend trigonometry beyond right-angled triangles to ANY triangle. The sine rule (a/sin A = b/sin B = c/sin C) is used when you know a pair of an angle and its opposite side, plus one more piece of information. The cosine rule (a² = b² + c² - 2bc cos A) is used when you know all three sides, or two sides and the angle between them (not opposite a known side). The area of any triangle can also be found using 1/2 × a × b × sin C, useful when the base and perpendicular height aren't directly given but two sides and the angle between them are known.",
        workedExamples: [
          {
            problem: "In a triangle, angle A = 40°, angle B = 60°, and side a = 8 cm. Find side b using the sine rule.",
            solution: [
              "Use the sine rule: a/sin A = b/sin B",
              "8/sin 40° = b/sin 60°",
              "Rearrange: b = (8 × sin 60°) ÷ sin 40°",
              "b = (8 × 0.866) ÷ 0.643 ≈ 10.8 cm",
            ],
          },
          {
            problem: "A triangle has sides b = 7 cm, c = 5 cm, and the angle between them A = 60°. Find the area.",
            solution: [
              "Use area = 1/2 × b × c × sin A",
              "Area = 1/2 × 7 × 5 × sin 60°",
              "Area = 1/2 × 35 × 0.866",
              "The area is approximately 15.2 cm².",
            ],
          },
        ],
        teachingSteps: [
          "Activate prior knowledge: recap right-angle trigonometry (SOH CAH TOA) from Sec1-2 as the foundation being extended.",
          "Introduce: build a simple decision checklist together — what information is given (two angles and a side? two sides and an included angle? all three sides?) — before naming any formula.",
          "Worked example: solve a triangle using the sine rule, explicitly checking the checklist first to justify why sine rule applies.",
          "Worked example 2: solve a different triangle using the cosine rule, again checking the checklist first.",
          "Worked example 3: calculate a triangle's area using the half-ab-sin-C formula when the base and height aren't directly given.",
          "Guided practice: solve 2-3 more triangles together, using the checklist to choose the rule each time before calculating.",
          "Independent practice: have students solve a mixed set of triangle problems, requiring them to state which rule they chose and why before solving.",
        ],
      },
      {
        title: "Mensuration: Arc Length and Sector Area",
        strand: "Geometry and Measurement",
        description:
          "Finding arc length and sector area as a proportion of the full circle's circumference/area, based on the sector's angle. Frame it explicitly as what fraction of the whole circle the sector represents — that framing prevents the formula from feeling arbitrary.",
        conceptExplanation:
          "A sector is a 'slice' of a circle, bounded by two radii and an arc, and its angle (out of the full 360° of the circle) determines what fraction of the whole circle it represents. Both arc length and sector area are calculated using this same fraction: arc length = (angle/360°) × the full circumference (2πr), and sector area = (angle/360°) × the full area (πr²). Thinking of it as 'what fraction of the whole circle is this sector' — rather than memorising the formulas as arbitrary — makes the formulas make sense and easier to remember.",
        workedExamples: [
          {
            problem: "A sector has a radius of 6 cm and an angle of 60°. Find its arc length in terms of π.",
            solution: [
              "The sector represents 60/360 = 1/6 of the full circle.",
              "Full circumference = 2πr = 2π(6) = 12π cm",
              "Arc length = 1/6 × 12π",
              "The arc length is 2π cm.",
            ],
          },
          {
            problem: "Using the same sector (radius 6 cm, angle 60°), find its area in terms of π.",
            solution: [
              "The sector represents 60/360 = 1/6 of the full circle.",
              "Full area = πr² = π(6²) = 36π cm²",
              "Sector area = 1/6 × 36π",
              "The sector area is 6π cm².",
            ],
          },
        ],
        teachingSteps: [
          "Introduce: show a sector and ask what fraction of the full circle it represents, based on its angle out of 360°.",
          "Worked example: calculate arc length as that fraction multiplied by the full circumference, explicitly narrating the fraction each time.",
          "Guided practice: calculate 2-3 more arc lengths together, always stating the fraction-of-360° first.",
          "Worked example 2: calculate sector area the same way, as the fraction multiplied by the full circle's area.",
          "Independent practice: have students calculate one arc length and one sector area on their own.",
          "Check for understanding: give a sector with an angle greater than 180° and check the student still applies the same fraction logic correctly.",
        ],
      },
      {
        title: "Coordinate Geometry of Straight Lines",
        diagram: {
          type: "coordinate-plane",
          xRange: [-5, 5],
          yRange: [-5, 5],
          points: [
            { x: -2, y: -1, label: "A" },
            { x: 3, y: 4, label: "B" },
          ],
          lines: [{ from: [-2, -1], to: [3, 4] }],
        },
        strand: "Geometry and Measurement",
        description:
          "Finding gradient, midpoint and length of a line segment, and the equation of a line, extending the Sec2 linear graphs work into full coordinate geometry. Explicitly connect gradient here to the gradient already learned for linear graphs — it's the same concept, more formal notation.",
        conceptExplanation:
          "Coordinate geometry works with points defined by (x, y) coordinates rather than a drawn graph. The gradient of a line segment between two points (x₁,y₁) and (x₂,y₂) is calculated as (y₂-y₁)/(x₂-x₁) — the change in y divided by the change in x — giving the same value as reading gradient off a graph, just calculated directly from coordinates. The midpoint of a segment is the average of the two x-coordinates and the average of the two y-coordinates, and the length of a segment is found using a version of Pythagoras' theorem applied to the horizontal and vertical distances between the points. The equation of a line can be found once its gradient and one point on it are known, using y - y₁ = m(x - x₁).",
        workedExamples: [
          {
            problem: "Find the gradient of the line segment between points (2, 3) and (6, 11).",
            solution: [
              "Use gradient = (y₂ - y₁) ÷ (x₂ - x₁)",
              "Gradient = (11 - 3) ÷ (6 - 2)",
              "Gradient = 8 ÷ 4",
              "The gradient is 2.",
            ],
          },
          {
            problem: "Find the midpoint and length of the segment between (1, 2) and (7, 10).",
            solution: [
              "Midpoint: average the x-coordinates and y-coordinates separately. x: (1+7)/2 = 4, y: (2+10)/2 = 6. Midpoint = (4, 6)",
              "Length: use Pythagoras on the horizontal and vertical distances. Horizontal distance = 7-1 = 6, vertical distance = 10-2 = 8",
              "Length = √(6² + 8²) = √(36 + 64) = √100",
              "The length is 10 units.",
            ],
          },
        ],
        teachingSteps: [
          "Activate prior knowledge: recap finding gradient from a linear graph in Sec2, then show the same idea using just two coordinate points and a formula.",
          "Worked example: calculate the gradient, midpoint and length of a line segment between two given points.",
          "Guided practice: calculate the same three quantities for 2-3 more point pairs together.",
          "Worked example 2: find the equation of a line given its gradient and one point, connecting back to y = mx + c from Sec2.",
          "Independent practice: have students find the gradient, midpoint, length and equation for a new pair of points on their own.",
          "Check for understanding: ask a student to explain why the gradient formula here gives the same value as reading gradient off a graph, tying the two representations together explicitly.",
        ],
      },
    ],
  },
  {
    level: "SEC4",
    topics: [
      {
        title: "Functions and Graphs",
        strand: "Number and Algebra",
        description:
          "Function notation and sketching/interpreting graphs of quadratic, power, exponential and other functions studied so far. Ask students to describe each graph's shape and key features in words before sketching — it builds the intuition that makes later curve-sketching faster.",
        conceptExplanation:
          "Function notation, f(x), is a compact way to describe a rule that turns an input (x) into an output — f(x) = 2x + 1 means 'take x, multiply by 2, then add 1.' To evaluate f(3), substitute 3 everywhere x appears in the rule. Different types of functions produce distinctly-shaped graphs: a quadratic function produces a U-shaped (or upside-down U) parabola, a cubic function produces an S-shaped curve, and an exponential function produces a curve that grows (or shrinks) increasingly steeply and never actually touches the x-axis. Recognising a function's type from its equation, and predicting its graph's general shape before sketching, builds the intuition needed for interpreting more complex graphs.",
        workedExamples: [
          {
            problem: "If f(x) = 2x² - 3, find f(4).",
            solution: ["Substitute x = 4 into the function.", "f(4) = 2(4²) - 3", "4² = 16, so f(4) = 2(16) - 3", "f(4) = 32 - 3 = 29"],
          },
          {
            problem: "Describe the general shape of the graph of y = 2^x (an exponential function) as x increases.",
            solution: [
              "An exponential function with a base greater than 1 grows increasingly steeply as x increases.",
              "The graph never touches or crosses the x-axis, since 2^x is always positive.",
              "As x increases, y grows faster and faster (the curve gets steeper), rising sharply for large x.",
            ],
          },
        ],
        teachingSteps: [
          "Introduce: introduce function notation f(x), evaluating f at a few given values together to build familiarity.",
          "Discuss: before sketching, have students describe in words what shape a quadratic, cubic or exponential graph should have and why.",
          "Worked example: sketch a quadratic graph from its equation, labelling key features (roots, turning point, y-intercept).",
          "Worked example 2: sketch an exponential graph, discussing its distinct shape (always positive, never touching the x-axis) compared to the quadratic.",
          "Guided practice: sketch 2-3 more graphs from different function families together, describing the shape in words each time before drawing.",
          "Independent practice: have students sketch one new function's graph, labelling all key features.",
          "Check for understanding: give an equation and ask the student to predict its graph's general shape before sketching, to confirm the word-first habit is genuine.",
        ],
      },
      {
        title: "Matrices: Operations and Applications",
        strand: "Number and Algebra",
        description:
          "Matrix addition, subtraction, scalar and matrix multiplication, and using matrices to represent and solve simple real-world problems. Keep dimensions visible at every step (e.g. label a matrix as 2-by-3) — mismatched dimensions are the most common reason multiplication goes wrong.",
        conceptExplanation:
          "A matrix is an organised rectangular table of numbers, described by its dimensions (rows × columns) — a matrix with 2 rows and 3 columns is called a '2 by 3' matrix. Adding or subtracting matrices requires them to have the SAME dimensions, and is done by adding or subtracting the corresponding numbers in each position. Multiplying a matrix by a single number (a scalar) means multiplying every entry by that number. Multiplying two matrices together is more complex and only works if the number of columns in the first matrix matches the number of rows in the second matrix — this dimension check must always be done before attempting the multiplication.",
        workedExamples: [
          {
            problem: "Add the matrices [[1, 2], [3, 4]] and [[5, 6], [7, 8]].",
            solution: [
              "Both matrices have the same dimensions (2 by 2), so addition is possible.",
              "Add each corresponding position: top-left: 1+5=6, top-right: 2+6=8, bottom-left: 3+7=10, bottom-right: 4+8=12",
              "The result is [[6, 8], [10, 12]].",
            ],
          },
          {
            problem: "Can a 2×3 matrix be multiplied by a 4×2 matrix? Why or why not?",
            solution: [
              "For matrix multiplication, the number of columns in the first matrix must match the number of rows in the second matrix.",
              "The first matrix has 3 columns. The second matrix has 4 rows.",
              "3 does not equal 4, so this multiplication is not possible.",
            ],
          },
        ],
        teachingSteps: [
          "Introduce: introduce a matrix as an organised table of numbers, always labelling its dimensions (rows by columns) explicitly.",
          "Worked example: add and subtract two matrices of matching dimensions, checking dimensions match before starting.",
          "Worked example 2: multiply a matrix by a scalar, then work through matrix-by-matrix multiplication, checking dimension compatibility at every step.",
          "Guided practice: perform 2-3 more matrix operations together, labelling dimensions before each calculation.",
          "Worked example 3: use a matrix to represent and solve a simple real-world data problem (e.g. combining sales data).",
          "Independent practice: have students perform one matrix multiplication and one real-world application problem on their own.",
          "Check for understanding: give two matrices with mismatched dimensions for multiplication and check the student identifies it's not possible before attempting to calculate.",
        ],
      },
      {
        title: "Probability",
        strand: "Statistics and Probability",
        description:
          "Combined events, using tree diagrams and Venn diagrams, and distinguishing independent from mutually exclusive events. Independent vs. mutually exclusive is the recurring point of confusion — contrast a clear example of each side by side rather than defining them abstractly.",
        conceptExplanation:
          "Combined events involve more than one action (like flipping a coin twice, or drawing two cards), and their probabilities can be organised using a tree diagram, where each branch represents a possible outcome and its probability. Independent events are events where one outcome does NOT affect the other (like two separate coin flips) — the combined probability is found by MULTIPLYING along the branches. Mutually exclusive events are events that CANNOT both happen at the same time (like drawing a single card that is red OR black) — the combined probability of one OR the other happening is found by ADDING their individual probabilities. Confusing these two situations, and using the wrong operation, is the most common error in this topic.",
        workedExamples: [
          {
            problem: "A fair coin is flipped twice. Find the probability of getting heads both times.",
            solution: [
              "Each flip is independent — the first flip doesn't affect the second.",
              "Probability of heads on the first flip: 1/2",
              "Probability of heads on the second flip: 1/2",
              "Since the events are independent, multiply: 1/2 × 1/2 = 1/4",
            ],
          },
          {
            problem: "A bag has 3 red, 2 blue, and 5 green balls. Find the probability of picking a red OR a blue ball in a single draw.",
            solution: [
              "Picking red and picking blue in a single draw are mutually exclusive — you can't pick both colours at once.",
              "Probability of red: 3/10. Probability of blue: 2/10.",
              "Since the events are mutually exclusive, add: 3/10 + 2/10 = 5/10, which simplifies to 1/2",
            ],
          },
        ],
        teachingSteps: [
          "Review: recap single-event theoretical probability from Sec2.",
          "Introduce: contrast one clear independent-events example (two separate coin flips) with one clear mutually-exclusive example (drawing a red OR a blue ball from one draw), side by side.",
          "Worked example: build a tree diagram for two independent events, calculating the probability of a combined outcome by multiplying along branches.",
          "Guided practice: build 1-2 more tree diagrams together, including at least one 'without replacement' (dependent) case.",
          "Worked example 2: solve a mutually-exclusive combined-probability problem using addition instead of multiplication, contrasting the method against the tree-diagram case.",
          "Independent practice: have students solve one tree-diagram problem and one mutually-exclusive problem on their own.",
          "Check for understanding: give a new scenario and ask the student to classify it as independent or mutually exclusive before choosing multiply-vs-add, to confirm the distinction is genuinely understood.",
        ],
      },
      {
        title: "Statistics: Measures of Central Tendency and Spread",
        strand: "Statistics and Probability",
        description:
          "Calculating and comparing mean, median, mode, range and standard deviation, including from grouped/frequency data, and interpreting cumulative frequency curves. Always ask what the numbers mean in context (which data set is more consistent?) rather than treating this as pure computation.",
        conceptExplanation:
          "Mean, median and mode are three different ways of describing a 'typical' or central value in a data set: the mean is the total divided by the number of values, the median is the middle value when the data is ordered, and the mode is the most frequently occurring value. Range and standard deviation both describe how SPREAD OUT the data is: range is simply the highest value minus the lowest, while standard deviation is a more precise measure that accounts for every value's distance from the mean. Two data sets can have the same mean but very different standard deviations — a smaller standard deviation means the data is more tightly clustered (more consistent), which is often more meaningful in context than the mean alone.",
        workedExamples: [
          {
            problem: "Find the mean, median and range of the data set: 4, 7, 7, 9, 13.",
            solution: [
              "Mean: add all values and divide by the count. 4+7+7+9+13 = 40, divided by 5 = 8",
              "Median: the data is already ordered; the middle value (3rd of 5) is 7.",
              "Range: highest - lowest = 13 - 4 = 9",
              "Mean = 8, median = 7, range = 9.",
            ],
          },
          {
            problem: "Two classes both have a mean test score of 65. Class A has a standard deviation of 5, and Class B has a standard deviation of 15. What does this tell you?",
            solution: [
              "Both classes have the same average performance (mean = 65).",
              "Class A's smaller standard deviation (5) means its scores are more tightly clustered around 65 — most students scored close to the mean.",
              "Class B's larger standard deviation (15) means its scores are much more spread out — some students scored well above or below 65.",
              "Class A's results are more consistent, even though both classes have the same average.",
            ],
          },
        ],
        teachingSteps: [
          "Review: recap calculating the mean from grouped data from Sec2.",
          "Worked example: calculate median, mode and range from a data set, discussing what each measure tells you that the others don't.",
          "Worked example 2: calculate standard deviation for a small data set, connecting it conceptually to 'how spread out the data is' before treating it as a formula.",
          "Discuss: compare two data sets with similar means but different standard deviations, asking which one is more 'consistent' and why that matters in context.",
          "Worked example 3: construct and interpret a cumulative frequency curve, reading off the median and quartiles from it.",
          "Independent practice: have students calculate a full set of statistics for one data set and interpret what they show in context.",
          "Check for understanding: ask a student to explain, in a real-world sentence (not just numbers), what a smaller standard deviation means about the data.",
        ],
      },
      {
        title: "Vectors in Two Dimensions",
        strand: "Geometry and Measurement",
        description:
          "Vector notation, magnitude, addition, subtraction and scalar multiplication, and using vectors to solve geometric problems. Draw every vector as an arrow on a diagram before manipulating it algebraically — vectors are fundamentally geometric, and the notation should follow the picture, not replace it.",
        conceptExplanation:
          "A vector represents a quantity with both magnitude (size/length) and direction, shown as an arrow on a diagram, and written in column notation as (x above y) showing the horizontal and vertical movement it represents. Adding two vectors means combining their movements — drawn 'tip to tail' on a diagram, or by adding their corresponding x and y components directly in column form. The magnitude (length) of a vector is calculated using Pythagoras' theorem on its x and y components, since the vector, its horizontal component, and its vertical component form a right-angled triangle. Vectors are a powerful tool for proving geometric facts, such as showing two lines are parallel (one vector is a scalar multiple of the other) or finding a midpoint.",
        workedExamples: [
          {
            problem: "Add the vectors (3 above 2) and (1 above 4).",
            solution: [
              "Add the corresponding x-components: 3 + 1 = 4",
              "Add the corresponding y-components: 2 + 4 = 6",
              "The resulting vector is (4 above 6).",
            ],
          },
          {
            problem: "Find the magnitude of the vector (3 above 4).",
            solution: [
              "The vector's components form a right-angled triangle with legs 3 and 4.",
              "Use Pythagoras' theorem: magnitude = √(3² + 4²)",
              "√(9 + 16) = √25",
              "The magnitude is 5.",
            ],
          },
        ],
        teachingSteps: [
          "Introduce: draw a vector as an arrow on a grid, discussing that it has both magnitude (length) and direction, unlike a plain number.",
          "Worked example: add two vectors by drawing them tip-to-tail on the diagram, then confirm the same result using column-vector addition.",
          "Worked example 2: calculate a vector's magnitude using Pythagoras' theorem, connecting back to that Sec2 topic explicitly.",
          "Guided practice: perform 2-3 more vector additions/subtractions together, always drawing the diagram first.",
          "Worked example 3: use vectors to solve a simple geometric problem (e.g. showing two lines are parallel because one vector is a scalar multiple of the other).",
          "Independent practice: have students solve one vector arithmetic problem and one geometric application problem.",
          "Check for understanding: ask a student to sketch a given column vector on a grid before doing any calculation with it, to keep the geometric picture central.",
        ],
      },
      {
        title: "Further Trigonometry: 3D Problems and Bearings",
        strand: "Geometry and Measurement",
        description:
          "Applying trigonometry and Pythagoras' theorem to three-dimensional solids and to bearings problems. Sketching a clear, correctly-labelled diagram is most of the battle for 3D and bearings questions — insist on it before any calculation.",
        conceptExplanation:
          "3D trigonometry problems apply the same trigonometric ratios and Pythagoras' theorem learned for flat (2D) triangles, but require first identifying the correct 2D triangle hidden WITHIN the 3D solid — this is why sketching a clear, separate diagram of just that triangle is essential before calculating. Bearings describe direction as an angle measured CLOCKWISE from north, always written as three digits (e.g. 065° or 245°). Bearings problems typically involve forming a triangle between two or more locations and using the sine rule, cosine rule, or basic trigonometry to find an unknown distance or angle, always starting with a clearly labelled compass direction at each point.",
        workedExamples: [
          {
            problem: "A cuboid has a base of 6 cm by 8 cm and a height of 10 cm. Find the length of the diagonal from one bottom corner to the opposite top corner.",
            solution: [
              "First find the diagonal of the base rectangle using Pythagoras: √(6² + 8²) = √(36+64) = √100 = 10 cm",
              "This base diagonal, together with the height, forms a new right-angled triangle (the base diagonal is one leg, the height is the other leg, and the solid's space diagonal is the hypotenuse).",
              "Use Pythagoras again: space diagonal = √(10² + 10²) = √(100+100) = √200",
              "The space diagonal is approximately 14.1 cm.",
            ],
          },
          {
            problem: "A ship sails from port A on a bearing of 060° for 5 km to point B. Describe how to set up the diagram for finding the bearing of A from B.",
            solution: [
              "Draw a north line at A, and mark the bearing 060° (60° clockwise from north) as the direction of travel to B.",
              "Draw a north line at B as well (north lines are always parallel to each other).",
              "The bearing of A from B will use alternate angles between the two parallel north lines, connecting back to the angle facts for parallel lines.",
            ],
          },
        ],
        teachingSteps: [
          "Activate prior knowledge: recap the Sec3 sine rule, cosine rule and Pythagoras' theorem as the tools being applied here.",
          "Introduce: for a 3D solid problem, insist on sketching and labelling a clear diagram first, identifying which 2D triangle within the solid actually needs to be solved.",
          "Worked example: solve a 3D problem (e.g. the angle between a diagonal and a base of a cuboid) by extracting and solving that one right-angled triangle.",
          "Introduce: for bearings, review that bearings are measured clockwise from north, and always sketch a compass/north line at each relevant point first.",
          "Worked example 2: solve a bearings problem using the sine or cosine rule on the triangle formed between the given points.",
          "Guided practice: solve one more 3D problem and one more bearings problem together, insisting on the diagram-first habit each time.",
          "Independent practice: have students solve one 3D problem and one bearings problem on their own, sketching the diagram before calculating.",
        ],
      },
      {
        title: "Transformations",
        strand: "Geometry and Measurement",
        description:
          "Describing and performing reflection, rotation, translation and enlargement, including using matrices to represent transformations. Tracing paper is genuinely useful even at this level for building intuition before moving to the matrix representation.",
        conceptExplanation:
          "A transformation changes a shape's position, size, or orientation while following specific rules. Translation slides a shape without rotating or resizing it, described by a column vector showing the horizontal and vertical shift. Reflection flips a shape across a mirror line, rotation turns a shape around a fixed centre point by a given angle, and enlargement resizes a shape by a scale factor from a centre point. Each of these (except translation) can also be represented using a transformation matrix, which is applied to a shape's coordinates to calculate exactly where each point moves to — giving the same result as physically performing the transformation, just calculated algebraically instead.",
        workedExamples: [
          {
            problem: "A point (2, 3) is translated by the vector (4 above -1). Find its new coordinates.",
            solution: [
              "Translation adds the vector's components to the point's coordinates.",
              "New x: 2 + 4 = 6",
              "New y: 3 + (-1) = 2",
              "The new coordinates are (6, 2).",
            ],
          },
          {
            problem: "A shape is rotated 90° clockwise about the origin. If a point on the shape starts at (3, 5), describe how to verify the rotation using tracing paper.",
            solution: [
              "Trace the original point and the origin onto tracing paper.",
              "Physically rotate the tracing paper 90° clockwise around the traced origin point.",
              "Read off where the traced point (3, 5) now lands on the original grid — this gives the rotated coordinates, which can then be checked against the rotation matrix's calculated result.",
            ],
          },
        ],
        teachingSteps: [
          "Concrete: use tracing paper to physically perform a reflection, rotation and translation on a simple shape, discussing what changes and what stays the same in each.",
          "Worked example: describe a given transformation fully and precisely (e.g. 'rotation of 90° clockwise about the origin'), using the traced result to verify.",
          "Introduce: represent a translation as a column vector, and a reflection/rotation/enlargement using a transformation matrix.",
          "Worked example 2: apply a transformation matrix to a shape's coordinates, then check the result against a tracing-paper version of the same transformation.",
          "Guided practice: perform 2-3 more transformations together, alternating between tracing paper and matrix methods to cross-check.",
          "Independent practice: have students perform and fully describe one transformation, and represent one using a matrix, on their own.",
          "Check for understanding: give a transformed shape and ask a student to identify and fully describe what transformation was applied, working backward from the result.",
        ],
      },
      {
        title: "Applications: Direct and Inverse Variation",
        strand: "Number and Algebra",
        description:
          "Extends Sec2's direct/inverse proportion to variation involving squares, cubes and roots, applied to real-world contexts. Have students state the variation equation (e.g. y = kx²) explicitly and solve for k first — skipping this step is where most errors creep in.",
        conceptExplanation:
          "This extends Sec2's direct and inverse proportion to variation involving squares, cubes, or square roots — for example, 'y varies as the square of x' is written as the equation y = kx², where k is a fixed constant called the constant of variation. Solving a variation problem always follows the same two-step process: first, use one known pair of x and y values to solve for the constant k; then, use the now-complete equation (with k known) to find a new value of y (or x) for a different scenario. Skipping the first step (finding k) and trying to jump straight to scaling the values is the most common source of errors in this topic.",
        workedExamples: [
          {
            problem: "y varies as the square of x. When x = 3, y = 18. Find y when x = 5.",
            solution: [
              "Write the general equation: y = kx²",
              "Substitute the known values to find k: 18 = k(3²) = 9k",
              "k = 18 ÷ 9 = 2",
              "Now use the complete equation y = 2x² to find y when x = 5: y = 2(5²) = 2(25) = 50",
            ],
          },
          {
            problem: "y varies inversely as x. When x = 4, y = 15. Find y when x = 10.",
            solution: [
              "Write the general equation for inverse variation: y = k/x",
              "Substitute the known values to find k: 15 = k/4, so k = 15 × 4 = 60",
              "Now use the complete equation y = 60/x to find y when x = 10: y = 60/10 = 6",
            ],
          },
        ],
        teachingSteps: [
          "Activate prior knowledge: recap Sec2's direct and inverse proportion, including the unitary method.",
          "Introduce: introduce variation involving a square or cube (e.g. y varies as x²), writing the general equation y = kx² explicitly before touching any numbers.",
          "Worked example: use one given pair of values to solve for the constant k first, insisting this step is never skipped.",
          "Worked example 2: use the now-complete equation (with k known) to find a new value, applying it to a real-world context (e.g. how a quantity scales with the square of a dimension).",
          "Guided practice: solve 2-3 more variation problems together, always writing the general equation and solving for k as separate, explicit first steps.",
          "Independent practice: have students solve one square-variation and one inverse-variation problem, showing the k-first working each time.",
          "Check for understanding: give a problem where a student is tempted to skip straight to scaling without finding k first, and check they resist that shortcut.",
        ],
      },
    ],
  },
];
