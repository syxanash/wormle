#!/usr/loca/env ruby

require 'pp'

# test with https://swag.github.io/evil-wordle/

words_output = File.read('wordle_official_wordlist.txt')
words_list = words_output.split("\n")

File.write('./temp_words.txt', words_list)

words_filtered = words_list
  .select { |word| word.size == 5 }
  # .select { |word| word.chars.last != 's' }
  .select { |word| word.chars.first != word.chars.first.upcase }

File.write('./temp_words.txt', words_filtered)

loop do
  puts 'would you like me to choose the word for you?'
  answer = gets.chomp

  if answer == 'yes'
    chosen = words_filtered.shuffle.first
  else
    puts 'tell me your word:'
    chosen = gets.chomp
  end

  puts "the chosen word is #{chosen}"
  puts "what color series did you get? [B]lack/[G]reen/[Y]ello"
  answer_input = gets.chomp
  answer_sequence = answer_input.split('')

  if answer_input == 'ggggg'
    puts "the word was #{chosen}!!!"
    break
  end

  allowed_chars = []

  answer_sequence.each_with_index do |box, i|
    temp_char = chosen[i]
    words_to_delete = []

    if box == 'g'
      puts "keep the #{temp_char} in position #{i}"

      allowed_chars.push(temp_char)

      words_filtered.each do |temp_word|
        if temp_word[i] != temp_char
          words_to_delete.push(temp_word)
        end
      end
    elsif box == 'y'
      puts "ignore #{temp_char} from position #{i}"

      allowed_chars.push(temp_char)

      words_filtered.each do |temp_word|
        if !temp_word.include? temp_char
          words_to_delete.push(temp_word)
        end

        if temp_word[i] == temp_char
          words_to_delete.push(temp_word)
        end
      end
    elsif box == 'b'
      puts "delete all words with #{temp_char}"

      # "AREAE" IS ANOTHER EDGE CASE BECAUSE THE SECOND A IS GREEN
      # BUT THE FIRST ONE IS BLACK

      words_filtered.each do |temp_word|
        if (temp_word.include? temp_char) && (!allowed_chars.include? temp_char)
          words_to_delete.push(temp_word)
        end
      end
    end

    words_filtered = words_filtered.filter { |word| !words_to_delete.include? word }
  end

  pp words_filtered

  if words_filtered.size == 0
    puts 'finished all the words :('
    break
  end
end
