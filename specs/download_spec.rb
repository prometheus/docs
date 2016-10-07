require 'rspec'
require 'helpers/download'

describe Downloads::Asset do
  let(:asset) do
    Downloads::Asset.new({
      'name' => ' prometheus-1.2.0.freebsd-armv5.tar.gz',
    })
  end

  let(:beta) do
    Downloads::Asset.new({
      'name' => 'alertmanager-0.5.0-beta.0.darwin-amd64.tar.gz',
    })
  end

  describe '#os' do
    it 'extracts the operating system name' do
      expect(asset.os).to eql('freebsd')
      expect(beta.os).to eql('darwin')
    end
  end

  describe '#arch' do
    it 'extracts the architecture' do
      expect(asset.arch).to eql('armv5')
      expect(beta.arch).to eql('amd64')
    end
  end
end
